// import { Lexer, Parser, Interpreter } from '../../src/lang';

// describe('Interpreter', () => {
//   it('simple syntax', () => {
//     const code = `
//     {
//       @var number = 2;
//       @var a = number;
//       @var b = 10 * a + 10 * number / 4;
//       @var c = a - - b;
//     }`;
//     const lexer = new Lexer(code);
//     const parser = new Parser(lexer);
//     const interpreter = new Interpreter(parser);
//     interpreter.interpret();
//     expect(interpreter.GLOBAL_SCOPE).toEqual({ number: 2, a: 2, b: 25, c: 27 });
//   });
// });
