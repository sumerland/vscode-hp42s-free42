import * as vscode from 'vscode';
import { Configuration } from '../helper/configuration';

export class RpnFormatter {
  constructor() {}

  provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    let edits: vscode.TextEdit[] = [];

    // read Configuration
    let config = new Configuration(true);

    let codeLineNo = 0;

    // go through document line by line
    for (let i = 0; i < document.lineCount; i++) {
      let line = document.lineAt(i);
      let text = line.text;

      if (!line.isEmptyOrWhitespace) {

        // 1. Remove line numbers
        text = text.replace(/(^\s*\d+)(\s+|▸|▶|>)(.*)/, '$3');

        // 2. Remove LBL arrows ...
        //text = text.replace(/^(▸|▶|>)LBL/, 'LBL');

        // 3. Remove abbreviarion \Sigma, \GS, +/-, ...
        if (config.replaceAbbreviations) {
          // see https://www.swissmicros.com/dm42/decoder/ see 2. tab
          text = text.replace(/(^\s*)RCLx/, '$1RCL×');
          text = text.replace(/(^\s*)RCL\//, '$1RCL÷');

          text = text.replace(/(^\s*)STOx/, '$1STO×');
          text = text.replace(/(^\s*)STO\//, '$1STO÷');

          text = text.replace(/(^\s*)BASEx/, '$1BASE×');
          text = text.replace(/(^\s*)BASE\*/, '$1BASE×');
          text = text.replace(/(^\s*)BASE\//, '$1BASE÷');
          text = text.replace(/(^\s*)BASE\+\/-/, '$1BASE±');

          text = text.replace(/(^\s*)(R(\\|)\^)/, '$1R↑');
          text = text.replace(/(^\s*)(R(\\|)v)\b/, '$1R↓');

          text = text.replace(/(^\s*)(\\|)(Sigma|SUM|GS)\+/, '$1Σ+');
          text = text.replace(/(^\s*)(\\|)(Sigma|SUM|GS)-/, '$1Σ-');
          text = text.replace(/(^\s*)ALL(\\|)(Sigma|SUM|GS)/, '$1ALLΣ');
          text = text.replace(/(^\s*)CL(\\|)(Sigma|SUM|GS)/, '$1CLΣ');
          text = text.replace(/(^\s*)LIN(\\|)(Sigma|SUM|GS)/, '$1LINΣ');
          text = text.replace(/(^\s*)PR(\\|)(Sigma|SUM|GS)/, '$1PRΣ');
          text = text.replace(/(^\s*)(\\|)(Sigma|SUM|GS)REG/, '$1ΣREG');

          text = text.replace(/(^\s*)(\\|)->HR/, '$1→HR');
          text = text.replace(/(^\s*)(\\|)->HMS/, '$1→HMS');

          text = text.replace(/(^\s*)(\\|)->DEC/, '$1→DEC');
          text = text.replace(/(^\s*)(\\|)->OCT/, '$1→OCT');
          text = text.replace(/(^\s*)(\\|)->RAD/, '$1→RAD');
          text = text.replace(/(^\s*)(\\|)->HMS/, '$1→HMS');
          text = text.replace(/(^\s*)(\\|)->REC/, '$1→REC');
          text = text.replace(/(^\s*)(\\|)->DEG/, '$1→DEG');
          text = text.replace(/(^\s*)(\\|)->POL/, '$1→POL');

          text = text.replace(/(^\s*)X!=0\?/, '$1X≠0?');
          text = text.replace(/(^\s*)X#0\?/, '$1X≠0?');
          text = text.replace(/(^\s*)X<=0\?/, '$1X≤0?');
          text = text.replace(/(^\s*)X>=0\?/, '$1X≥0?');
          text = text.replace(/(^\s*)X!=Y\?/, '$1X≠Y');
          text = text.replace(/(^\s*)X<=Y0\?/, '$1X≤Y?');
          text = text.replace(/(^\s*)X>=Y\?/, '$1X≥Y?');

          text = text.replace(/(^\s*)10\^X/, '$110↑X');
          text = text.replace(/(^\s*)E\^X/, '$1E↑X');
          text = text.replace(/(^\s*)X\^2/, '$1X↑2');
          text = text.replace(/(^\s*)Y\^X/, '$1Y↑X');
          text = text.replace(/(^\s*)E\^X-1/, '$1E↑X-1');

          text = text.replace(/(^\s*)<-\b/, '$1←');
          text = text.replace(/(^\s*)\^\b/, '$1↑');
          text = text.replace(/(^\s*)v\b/, '$1↓');
          text = text.replace(/(^\s*)->\b/, '$1→');

          text = text.replace(/(^\s*)\/$/, '$1÷');

          text = text.replace(/(^\s*)\|-/, '$1⊢');
          text = text.replace(/(^\s*)├/, '$1⊢');
        }

        // 4. Reduce whitspace
        if (config.removeTooLongSpaces) {
          if (!/".*"/.test(text)) {
            // All without double quotes
            text = text.replace(/\s{2,}/g, ' ');
          } else {
            // with double quotes ...

            // reduce whitespace from line beginning to first double quotes
            if (/^(\w+)(\s+)"/.test(text)) {
              text = text.replace(/^(\w+)(\s+)"/, '$1 "');
            }

            // reduce whitespace from last double quote to the end of line
            //if (/"\s{2,}/.test(text)) {
            //  text = text.replace(/"\s{2,}/g, '" ');
            //}
          }

          if (/\s+IND\s+/.test(text)) {
            text = text.replace(/\s+IND\s+/, ' IND ');
          }

          if (/\s+TO\s+/.test(text)) {
            text = text.replace(/\s+TO\s+/, ' TO ');
          }

          // LBL "A" -> LBL A, without doublequotes
          if (/(LBL|GTO|XEQ) "([A-J,a-e])"/.test(text)) {
            text = text.replace(/(LBL|GTO|XEQ) "([A-J,a-e])"/, '$1 $2');
          }
        }

        // 5. Trim
        if (config.trimLine) {
          text = text.trim();
        }

        // 6. Insert/Refresh line numbers, when using line numbers
        if (config.useLineNumbers) {
          // when not comment line ...
          if (!text.match(/^\s*(@|#|\/\/)/)) {
            switch (true) {
              // code line is { n-Byte Prgm }
              case /^\{ .* \}/.test(text):
                codeLineNo = 0;
                break;
              // LBL "..."
              case /^LBL ".*"/.test(text):
                codeLineNo = 1;
                break;
              default:
                codeLineNo++;
            }

            // line format min. two digits
            text = text.replace(
              /^(\d+\s+|)(.+)/,
              (codeLineNo < 10 ? '0' + codeLineNo : codeLineNo) + ' $2'
            );
          }
        }

        edits.push(
          vscode.TextEdit.replace(
            new vscode.Range(line.range.start, line.range.end),
            text
          )
        );
      }

      // insert {} before LBL ".*"
      let match = text.match(/LBL "(.*)"/);
      if(match){
        let previousline = '';
        if(i > 0){
          previousline = document.lineAt(i-1).text;
        }

        if(!previousline.match(/\{ .* \}/)){
          edits.push(
            vscode.TextEdit.insert(line.range.start, (config.useLineNumbers ? '00 ': '') + '{ ' + match[1] + ' }' + '\r\n')
          );
        }
      }

    }

    return edits;
  }

  dispose() {}
}
