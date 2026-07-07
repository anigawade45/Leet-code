export const LANGUAGE_CONFIGS = {
  python: {
    id: 'python',
    name: 'Python',
    dockerImage: 'python:3.12-slim',
    fileName: 'main.py',
    compileCmd: null,
    runCmd: 'python main.py'
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    dockerImage: 'node:22-slim',
    fileName: 'main.js',
    compileCmd: null,
    runCmd: 'node main.js'
  },
  java: {
    id: 'java',
    name: 'Java',
    dockerImage: 'eclipse-temurin:21',
    fileName: 'Main.java',
    compileCmd: 'javac Main.java',
    runCmd: 'java Main'
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    dockerImage: 'gcc:14',
    fileName: 'main.cpp',
    compileCmd: 'g++ -O3 -s -w main.cpp -o main',
    runCmd: './main'
  },
  c: {
    id: 'c',
    name: 'C',
    dockerImage: 'gcc:14',
    fileName: 'main.c',
    compileCmd: 'gcc -O3 -s -w main.c -o main',
    runCmd: './main'
  }
}
