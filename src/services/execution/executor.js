import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { LANGUAGE_CONFIGS } from './languageConfig'
import { compileCode } from './compile'
import { runCode } from './run'

function parseCppMethod(code) {
  const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') 
  const solutionMatch = cleanCode.match(/class\s+Solution\s*\{([\s\S]*)\}\s*;?/)
  if (!solutionMatch) return null

  const classContent = solutionMatch[1]
  const methodRegex = /([a-zA-Z0-9_<>&:*\s]+?)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g
  let match
  while ((match = methodRegex.exec(classContent)) !== null) {
    const returnType = match[1].trim()
    const methodName = match[2].trim()
    const argsStr = match[3].trim()
    
    if (methodName !== 'Solution' && methodName !== 'solve') {
      const args = argsStr.split(',').map(arg => {
        const cleanArg = arg.trim()
        if (!cleanArg) return null
        const parts = cleanArg.split(/\s+/)
        if (parts.length < 2) return null
        const name = parts[parts.length - 1].replace(/[&*]/g, '')
        const type = parts.slice(0, parts.length - 1).join(' ').trim()
        return { type, name }
      }).filter(Boolean)
      
      return { returnType, methodName, args }
    }
  }
  return null
}

function generateCppWrapper(code, problem = null) {
  let methodInfo = null

  if (problem && problem.signature) {
    try {
      methodInfo = typeof problem.signature === 'string'
        ? JSON.parse(problem.signature)
        : problem.signature
    } catch (e) {
      console.warn('Failed to parse signature:', e.message)
    }
  }

  if (!methodInfo) {
    methodInfo = parseCppMethod(code)
  }

  if (!methodInfo && code.includes('twoSum')) {
    methodInfo = {
      returnType: 'vector<int>',
      methodName: 'twoSum',
      args: [
        { type: 'vector<int>', name: 'nums' },
        { type: 'int', name: 'target' }
      ]
    }
  }
  
  if (!methodInfo) {
    return `
#include <iostream>
#include <string>
#include <sstream>
#include <chrono>
using namespace std;
${code}
int main() {
    string input, line;
    while (getline(cin, line)) {
        input += line + "\\n";
    }
    auto _t0 = chrono::high_resolution_clock::now();
    solve(input);
    auto _t1 = chrono::high_resolution_clock::now();
    cout << "__TIME__" << chrono::duration<double, milli>(_t1 - _t0).count() << endl;
    return 0;
}
`;
  }

  let argParsers = `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <chrono>
#include <queue>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

${code}

vector<int> parseVectorInt(const string& s) {
    vector<int> res;
    size_t start = s.find('[');
    size_t end = s.find(']');
    if (start != string::npos && end != string::npos && end > start + 1) {
        string content = s.substr(start + 1, end - start - 1);
        stringstream ss(content);
        string token;
        while (getline(ss, token, ',')) {
            res.push_back(stoi(token));
        }
    }
    return res;
}

vector<string> parseVectorString(const string& s) {
    vector<string> res;
    size_t start = s.find('[');
    size_t end = s.find(']');
    if (start != string::npos && end != string::npos && end > start + 1) {
        string content = s.substr(start + 1, end - start - 1);
        stringstream ss(content);
        string token;
        while (getline(ss, token, ',')) {
            string item = token;
            item.erase(0, item.find_first_not_of(" \\t\\n\\r\\""));
            item.erase(item.find_last_not_of(" \\t\\n\\r\\"") + 1);
            res.push_back(item);
        }
    }
    return res;
}

ListNode* parseListNode(const string& s) {
    vector<int> nums = parseVectorInt(s);
    ListNode* dummy = new ListNode(0);
    ListNode* curr = dummy;
    for (int num : nums) {
        curr->next = new ListNode(num);
        curr = curr->next;
    }
    ListNode* head = dummy->next;
    delete dummy;
    return head;
}
`;

  let mainBody = `
int main() {
    Solution sol;
`;

  methodInfo.args.forEach((arg, idx) => {
    let cleanType = arg.type.replace(/[&*]/g, '').trim();
    if (cleanType.startsWith('std::')) {
      cleanType = cleanType.substring(5).trim();
    }
    mainBody += `    string line${idx};\n`;
    mainBody += `    if (!getline(cin, line${idx})) return 0;\n`;
    
    if (cleanType === 'vector<int>') {
      mainBody += `    vector<int> ${arg.name} = parseVectorInt(line${idx});\n`;
    } else if (cleanType === 'vector<string>') {
      mainBody += `    vector<string> ${arg.name} = parseVectorString(line${idx});\n`;
    } else if (cleanType === 'ListNode') {
      mainBody += `    ListNode* ${arg.name} = parseListNode(line${idx});\n`;
    } else if (cleanType === 'int') {
      mainBody += `    int ${arg.name} = stoi(line${idx});\n`;
    } else if (cleanType === 'double') {
      mainBody += `    double ${arg.name} = stod(line${idx});\n`;
    } else if (cleanType === 'string') {
      mainBody += `    string ${arg.name} = line${idx};\n`;
    } else if (cleanType === 'bool') {
      mainBody += `    bool ${arg.name} = (line${idx} == "true" || line${idx} == "1");\n`;
    } else {
      mainBody += `    string ${arg.name} = line${idx};\n`;
    }
  });

  const argNames = methodInfo.args.map(a => a.name).join(', ');
  mainBody += `    auto _t0 = chrono::high_resolution_clock::now();\n`;
  mainBody += `    auto result = sol.${methodInfo.methodName}(${argNames});\n`;
  mainBody += `    auto _t1 = chrono::high_resolution_clock::now();\n`;
  mainBody += `    cout << "__TIME__" << chrono::duration<double, milli>(_t1 - _t0).count() << endl;\n`;

  let cleanRetType = methodInfo.returnType.replace(/[&*]/g, '').trim();
  if (cleanRetType.startsWith('std::')) {
    cleanRetType = cleanRetType.substring(5).trim();
  }
  
  if (cleanRetType === 'vector<int>') {
    mainBody += `
    cout << "__RESULT__[";
    for (size_t i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i + 1 < result.size()) cout << ",";
    }
    cout << "]" << endl;
`;
  } else if (cleanRetType === 'vector<string>') {
    mainBody += `
    cout << "__RESULT__[";
    for (size_t i = 0; i < result.size(); i++) {
        cout << "\\"" << result[i] << "\\"";
        if (i + 1 < result.size()) cout << ",";
    }
    cout << "]" << endl;
`;
  } else if (cleanRetType === 'ListNode') {
    mainBody += `
    cout << "__RESULT__[";
    ListNode* curr = result;
    while (curr) {
        cout << curr->val;
        if (curr->next) cout << ",";
        curr = curr->next;
    }
    cout << "]" << endl;
`;
  } else if (cleanRetType === 'bool') {
    mainBody += `    cout << "__RESULT__" << (result ? "true" : "false") << endl;\n`;
  } else {
    mainBody += `    cout << "__RESULT__" << result << endl;\n`;
  }

  mainBody += `    return 0;\n}`;

  return argParsers + mainBody;
}

export function wrapCode(language, code, problem = null) {
  const lang = language.toLowerCase()
  
  if (lang === 'javascript') {
    if (code.includes('class Solution')) {
      return `
${code}

const fs = require('fs');
function main() {
    const input = fs.readFileSync(0, 'utf-8');
    const lines = input.split('\\n').map(l => l.trim()).filter(Boolean);
    const sol = new Solution();
    const methods = Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== 'constructor');
    if (methods.length === 0) return;
    const methodName = methods[0];
    const parsedArgs = lines.map(line => {
        try {
            return JSON.parse(line);
        } catch(e) {
            return line;
        }
    });
    const _t0 = process.hrtime.bigint();
    const result = sol[methodName](...parsedArgs);
    const _t1 = process.hrtime.bigint();
    console.log('__TIME__' + (Number(_t1 - _t0) / 1e6).toFixed(3));
    console.log('__RESULT__' + JSON.stringify(result));
}
main();
`;
    } else {
      // Detect plain function declarations: var/let/const fn = function(...) or function fn(...)
      const plainFnMatch = code.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/) ||
                           code.match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/m)
      const detectedFnName = plainFnMatch ? plainFnMatch[1] : null

      if (detectedFnName) {
        return `
${code}

const fs = require('fs');
function main() {
    const input = fs.readFileSync(0, 'utf-8');
    const lines = input.split('\\n').map(l => l.trim()).filter(Boolean);
    const parsedArgs = lines.map(line => {
        try {
            return JSON.parse(line);
        } catch(e) {
            return line;
        }
    });
    const _t0 = process.hrtime.bigint();
    const result = ${detectedFnName}(...parsedArgs);
    const _t1 = process.hrtime.bigint();
    console.log('__TIME__' + (Number(_t1 - _t0) / 1e6).toFixed(3));
    console.log('__RESULT__' + JSON.stringify(result));
}
main();
`;
      } else {
        return `
${code}

const fs = require('fs');
function main() {
    const input = fs.readFileSync(0, 'utf-8');
    if (typeof solve === 'function') {
        solve(input);
    }
}
main();
`;
      }
    }
  }

  if (lang === 'python') {
    if (code.includes('class Solution')) {
      return `
${code}

import sys
import json

def main():
    try:
        lines = [line.strip() for line in sys.stdin if line.strip()]
        parsed_args = []
        for line in lines:
            try:
                parsed_args.append(json.loads(line))
            except:
                parsed_args.append(line)
        sol = Solution()
        methods = [m for m in dir(Solution) if not m.startswith('__') and callable(getattr(Solution, m))]
        if not methods:
            return
        method_name = methods[0]
        method = getattr(sol, method_name)
        import time as _time
        _t0 = _time.perf_counter()
        result = method(*parsed_args)
        _t1 = _time.perf_counter()
        print('__TIME__' + f'{(_t1 - _t0) * 1000:.3f}')
        print('__RESULT__' + json.dumps(result))
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
    } else {
      return `
${code}

import sys

def main():
    input_data = sys.stdin.read()
    if 'solve' in globals():
        solve(input_data)

if __name__ == "__main__":
    main()
`;
    }
  }

  if (lang === 'java') {
    if (code.includes('class Solution')) {
      return `
import java.util.*;
import java.io.*;
import java.lang.reflect.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

${code}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = reader.readLine()) != null) {
            lines.add(line.trim());
        }
        Class<?> clazz = Class.forName("Solution");
        Method targetMethod = null;
        for (Method m : clazz.getDeclaredMethods()) {
            if (Modifier.isPublic(m.getModifiers()) && !m.getName().equals("solve") && !m.getName().equals("main")) {
                targetMethod = m;
                break;
            }
        }
        if (targetMethod == null) {
            System.err.println("No public method found in Solution class");
            return;
        }
        Object sol = clazz.getDeclaredConstructor().newInstance();
        Class<?>[] paramTypes = targetMethod.getParameterTypes();
        Object[] params = new Object[paramTypes.length];
        for (int i = 0; i < paramTypes.length; i++) {
            if (i < lines.size()) {
                try {
                    params[i] = parseJavaType(lines.get(i), paramTypes[i]);
                } catch (Exception e) {
                    System.err.println("Failed to parse param " + i + ": " + lines.get(i) + " as " + paramTypes[i].getName());
                    System.err.println("Error: " + e.getMessage());
                    return;
                }
            }
        }
        // Warm-up phase to load classes and trigger initial JIT compilation
        try {
            targetMethod.invoke(sol, params);
        } catch (Exception e) {
            // Ignore warm-up errors
        }
        
        long _t0 = System.nanoTime();
        Object result = targetMethod.invoke(sol, params);
        long _t1 = System.nanoTime();
        System.out.println("__TIME__" + (_t1 - _t0) / 1_000_000.0);
        if (result == null) {
            System.err.println("Solution method returned null - this is likely an error in the solution code");
            System.out.println("__RESULT__null");
        } else if (result.getClass().isArray()) {
            StringBuilder sb = new StringBuilder("[");
            if (result instanceof int[]) {
                int[] arr = (int[]) result;
                for (int i = 0; i < arr.length; i++) {
                    sb.append(arr[i]);
                    if (i + 1 < arr.length) sb.append(",");
                }
            } else if (result instanceof double[]) {
                double[] arr = (double[]) result;
                for (int i = 0; i < arr.length; i++) {
                    sb.append(arr[i]);
                    if (i + 1 < arr.length) sb.append(",");
                }
            } else if (result instanceof long[]) {
                long[] arr = (long[]) result;
                for (int i = 0; i < arr.length; i++) {
                    sb.append(arr[i]);
                    if (i + 1 < arr.length) sb.append(",");
                }
            } else if (result instanceof boolean[]) {
                boolean[] arr = (boolean[]) result;
                for (int i = 0; i < arr.length; i++) {
                    sb.append(arr[i]);
                    if (i + 1 < arr.length) sb.append(",");
                }
            } else {
                Object[] arr = (Object[]) result;
                for (int i = 0; i < arr.length; i++) {
                    sb.append(arr[i]);
                    if (i + 1 < arr.length) sb.append(",");
                }
            }
            sb.append("]");
            System.out.println("__RESULT__" + sb.toString());
        } else if (result instanceof ListNode) {
            StringBuilder sb = new StringBuilder("[");
            ListNode curr = (ListNode) result;
            while (curr != null) {
                sb.append(curr.val);
                if (curr.next != null) sb.append(",");
                curr = curr.next;
            }
            sb.append("]");
            System.out.println("__RESULT__" + sb.toString());
        } else {
            System.out.println("__RESULT__" + result.toString());
        }
    }

    private static Object parseJavaType(String val, Class<?> type) {
        val = val.trim();
        if (type == int.class || type == Integer.class) {
            return Integer.parseInt(val);
        }
        if (type == double.class || type == Double.class) {
            return Double.parseDouble(val);
        }
        if (type == boolean.class || type == Boolean.class) {
            return Boolean.parseBoolean(val);
        }
        if (type == String.class) {
            if (val.startsWith("\\"") && val.endsWith("\\"") && val.length() >= 2) {
                return val.substring(1, val.length() - 1);
            }
            return val;
        }
        if (type == int[].class) {
            val = val.replace("[", "").replace("]", "").trim();
            if (val.isEmpty()) return new int[0];
            String[] parts = val.split(",");
            int[] arr = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                arr[i] = Integer.parseInt(parts[i].trim());
            }
            return arr;
        }
        if (type == String[].class) {
            val = val.replace("[", "").replace("]", "").trim();
            if (val.isEmpty()) return new String[0];
            String[] parts = val.split(",");
            String[] arr = new String[parts.length];
            for (int i = 0; i < parts.length; i++) {
                String s = parts[i].trim();
                if (s.startsWith("\\"") && s.endsWith("\\"") && s.length() >= 2) {
                    s = s.substring(1, s.length() - 1);
                }
                arr[i] = s;
            }
            return arr;
        }
        if (type == ListNode.class) {
            val = val.replace("[", "").replace("]", "").trim();
            if (val.isEmpty()) return null;
            String[] parts = val.split(",");
            ListNode dummy = new ListNode(0);
            ListNode curr = dummy;
            for (String part : parts) {
                curr.next = new ListNode(Integer.parseInt(part.trim()));
                curr = curr.next;
            }
            return dummy.next;
        }
        return val;
    }
}
`;
    } else {
      return `
import java.util.*;
import java.io.*;

${code}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\\n");
        }
        Solution.solve(sb.toString());
    }
}
`;
    }
  }

  if (lang === 'cpp') {
    return generateCppWrapper(code, problem)
  }

  if (lang === 'c') {
    if (code.includes('twoSum')) {
      return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

${code}

int main() {
    char line1[1024];
    char line2[64];
    if (!fgets(line1, sizeof(line1), stdin)) return 0;
    if (!fgets(line2, sizeof(line2), stdin)) return 0;
    int nums[256];
    int size = 0;
    char *p = strchr(line1, '[');
    if (p) {
        p++;
        char *token = strtok(p, ",]");
        while (token) {
            nums[size++] = atoi(token);
            token = strtok(NULL, ",]");
        }
    }
    int target = atoi(line2);
    int returnSize = 0;
    
    struct timespec _t0, _t1;
    clock_gettime(CLOCK_MONOTONIC, &_t0);
    int* result = twoSum(nums, size, target, &returnSize);
    clock_gettime(CLOCK_MONOTONIC, &_t1);
    double elapsed = (_t1.tv_sec - _t0.tv_sec) * 1000.0 + (_t1.tv_nsec - _t0.tv_nsec) / 1000000.0;
    printf("__TIME__%.3f\\n", elapsed);

    printf("__RESULT__[");
    for (int i = 0; i < returnSize; i++) {
        printf("%d", result[i]);
        if (i + 1 < returnSize) printf(",");
    }
    printf("]\\n");
    free(result);
    return 0;
}
`;
    } else if (code.includes('addTwoNumbers')) {
      return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>

struct ListNode {
    int val;
    struct ListNode *next;
};

${code}

struct ListNode* parseListNode(const char* s) {
    struct ListNode* dummy = malloc(sizeof(struct ListNode));
    dummy->val = 0;
    dummy->next = NULL;
    struct ListNode* curr = dummy;
    
    const char* p = strchr(s, '[');
    if (p) {
        p++;
        char buffer[1024];
        strcpy(buffer, p);
        char* bracket = strchr(buffer, ']');
        if (bracket) *bracket = '\\0';
        
        char* token = strtok(buffer, ",");
        while (token) {
            struct ListNode* node = malloc(sizeof(struct ListNode));
            node->val = atoi(token);
            node->next = NULL;
            curr->next = node;
            curr = curr->next;
            token = strtok(NULL, ",");
        }
    }
    struct ListNode* head = dummy->next;
    free(dummy);
    return head;
}

int main() {
    char line1[1024];
    char line2[1024];
    if (!fgets(line1, sizeof(line1), stdin)) return 0;
    if (!fgets(line2, sizeof(line2), stdin)) return 0;
    
    struct ListNode* l1 = parseListNode(line1);
    struct ListNode* l2 = parseListNode(line2);

    struct timespec _t0, _t1;
    clock_gettime(CLOCK_MONOTONIC, &_t0);
    struct ListNode* result = addTwoNumbers(l1, l2);
    clock_gettime(CLOCK_MONOTONIC, &_t1);
    
    double elapsed = (_t1.tv_sec - _t0.tv_sec) * 1000.0 + (_t1.tv_nsec - _t0.tv_nsec) / 1000000.0;
    printf("__TIME__%.3f\\n", elapsed);

    printf("__RESULT__[");
    struct ListNode* curr = result;
    while (curr) {
        printf("%d", curr->val);
        if (curr->next) printf(",");
        curr = curr->next;
    }
    printf("]\\n");
    return 0;
}
`;
    } else {
      return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

${code}

int main() {
    char input[4096] = {0};
    char line[1024];
    while (fgets(line, sizeof(line), stdin)) {
        strcat(input, line);
    }
    
    struct timespec _t0, _t1;
    clock_gettime(CLOCK_MONOTONIC, &_t0);
    solve(input);
    clock_gettime(CLOCK_MONOTONIC, &_t1);
    double elapsed = (_t1.tv_sec - _t0.tv_sec) * 1000.0 + (_t1.tv_nsec - _t0.tv_nsec) / 1000000.0;
    printf("__TIME__%.3f\\n", elapsed);

    return 0;
}
`;
    }
  }

  return code;
}

export function parseResultAndStdout(rawStdout) {
  let actual = ''
  let stdout = ''
  let time = null
  
  if (rawStdout && rawStdout.includes('__RESULT__')) {
    // Extract __TIME__ if present (algorithm-only time in ms)
    const timeMatch = rawStdout.match(/__TIME__([\d.]+)/)
    if (timeMatch) {
      time = parseFloat(timeMatch[1])
    }

    const parts = rawStdout.split('__RESULT__')
    stdout = parts[0].replace(/__TIME__[\d.]+\r?\n?/g, '')
    
    const remaining = parts[1].split('\n')
    actual = remaining[0].trim()
    
    // CRITICAL FIX: If actual is the string "null", this means the solution returned null
    // This should be treated as an error, not as a valid output
    if (actual === 'null') {
      console.warn('[WARN] Solution returned null - this may indicate an error in the code')
    }
    
    if (remaining.length > 1) {
      stdout += '\n' + remaining.slice(1).join('\n')
    }
    stdout = stdout.trim()
  } else {
    actual = (rawStdout || '').trim()
    stdout = ''
  }
  
  return { actual, stdout, time }
}

export async function execute({ language, code, input = '', timeout = 5000 }) {
  const submissionId = randomBytes(4).toString('hex')
  const tempDir = path.join(process.cwd(), 'temp', 'submissions', submissionId)
  
  const config = LANGUAGE_CONFIGS[language.toLowerCase()]
  if (!config) {
    return {
      status: 'Runtime Error',
      output: `Unsupported language: ${language}`,
      runtime: 0,
      memory: 0
    }
  }

  try {
    // Step 2 & 3: Create folder and save file
    await fs.mkdir(tempDir, { recursive: true })
    const filePath = path.join(tempDir, config.fileName)
    const wrappedCode = wrapCode(language, code)
    await fs.writeFile(filePath, wrappedCode, 'utf-8')

    // Step 4: Compile
    const compileResult = await compileCode({ config, tempDir })
    if (!compileResult.success) {
      return {
        status: 'Compilation Error',
        output: compileResult.stderr,
        runtime: 0,
        memory: 0
      }
    }

    // Step 5: Run
    const runResult = await runCode({ config, tempDir, inputData: input, timeout })
    
    let status = 'Accepted'
    const parsed = parseResultAndStdout(runResult.stdout)
    let output = parsed.actual

    if (runResult.status === 'Time Limit Exceeded') {
      status = 'Time Limit Exceeded'
      output = 'Time Limit Exceeded'
    } else if (runResult.exitCode !== 0) {
      status = 'Runtime Error'
      output = runResult.stderr || `Runtime failed with exit code: ${runResult.exitCode}`
    }

    return {
      output,
      status,
      runtime: parsed.time !== null ? parsed.time : runResult.time,
      memory: runResult.memory,
      stdout: parsed.stdout
    }
  } catch (error) {
    return {
      status: 'Runtime Error',
      output: error.message,
      runtime: 0,
      memory: 0
    }
  } finally {
    // Step 6: Delete Folder (cleanup)
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (e) {
      // ignore clean up errors
    }
  }
}
