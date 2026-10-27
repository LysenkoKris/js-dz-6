// Суффиксное дерево
//
// Это trie из прошлой лабы, в котором лежат все суффиксы строки.
// Например у "abab" суффиксы "abab", "bab", "ab", "b".
// Куски без развилок склеиваем в одно ребро, а на ребре храним только start и end.
// Тогда узлов не больше 2n.
// В конец строки добавляем END, чтобы каждый суффикс кончался в листе.
//
// Строим алгоритмом Укконена: идём по строке и добавляем каждую букву ко всем суффиксам сразу.
// Суффиксные ссылки помогают не начинать каждый раз с корня.
//
// Сложность (m - длина того, что ищем):
// - построение O(n)
// - поиск O(m)
// - память O(n)

export const END = -1;

export type SuffixTreeNode = {
  start: number; // на ребре буквы с start до end
  end: number;
  children: Map<number, SuffixTreeNode>;
  link: SuffixTreeNode | null; // суффиксная ссылка
  depth: number; // сколько букв от корня
  suffix: number; // номер суффикса у листа, у остальных -1
};

function createNode(start: number, end: number): SuffixTreeNode {
  return { start, end, children: new Map(), link: null, depth: 0, suffix: -1 };
}

export class SuffixTree {
  readonly symbols: number[];
  readonly root: SuffixTreeNode;
  readonly length: number; // длина исходной строки без END
  private count = 1;

  // строка или массив чисел с END в конце
  constructor(input: string | number[]) {
    if (typeof input === "string") {
      this.symbols = [...Array.from(input, (ch) => ch.codePointAt(0)!), END];
      this.length = this.symbols.length - 1;
    } else {
      this.symbols = input;
      this.length = input.length;
    }
    this.root = createNode(-1, -1);
    this.build();
    this.computeDepths();
  }

  get nodeCount(): number {
    return this.count;
  }

  includes(pattern: string): boolean {
    return this.descend(pattern) !== null;
  }

  // все позиции, где начинается pattern, по возрастанию
  occurrences(pattern: string): number[] {
    const node = this.descend(pattern);
    if (node === null) return [];

    const result: number[] = [];
    const stack = [node];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (cur.suffix !== -1) {
        if (cur.suffix < this.length) result.push(cur.suffix); // лист самого END не считаем
      }
      for (const child of cur.children.values()) stack.push(child);
    }
    return result.sort((a, b) => a - b);
  }

  // идём вниз по буквам образца
  private descend(pattern: string): SuffixTreeNode | null {
    const codes = Array.from(pattern, (ch) => ch.codePointAt(0)!);
    let node = this.root;
    let i = 0;

    while (i < codes.length) {
      const child = node.children.get(codes[i]!);
      if (!child) return null;

      // сравниваем буквы на ребре
      for (let j = child.start; j < child.end && i < codes.length; j++, i++) {
        if (this.symbols[j] !== codes[i]) return null;
      }
      node = child;
    }
    return node;
  }

  private edgeLength(node: SuffixTreeNode, pos: number): number {
    return Math.min(node.end, pos + 1) - node.start;
  }

  private build(): void {
    const s = this.symbols;
    const n = s.length;
    const LEAF_END = Infinity; // лист растёт до конца строки

    let activeNode = this.root;
    let activeEdge = 0; // с какой буквы начинается активное ребро
    let activeLength = 0;
    let remainder = 0;

    for (let pos = 0; pos < n; pos++) {
      let lastNew: SuffixTreeNode | null = null; // новый узел, ему потом нужна ссылка
      remainder++;

      while (remainder > 0) {
        if (activeLength === 0) activeEdge = pos;

        const next = activeNode.children.get(s[activeEdge]!);

        if (!next) {
          // такой буквы нет, добавляем лист
          activeNode.children.set(s[activeEdge]!, createNode(pos, LEAF_END));
          this.count++;
          if (lastNew) {
            lastNew.link = activeNode;
            lastNew = null;
          }
        } else {
          // ребро кончилось, идём в следующий узел
          const len = this.edgeLength(next, pos);
          if (activeLength >= len) {
            activeEdge += len;
            activeLength -= len;
            activeNode = next;
            continue;
          }

          // буква уже есть, просто сдвигаемся
          if (s[next.start + activeLength] === s[pos]) {
            if (lastNew) {
              lastNew.link = activeNode;
              lastNew = null;
            }
            activeLength++;
            break;
          }

          // буква другая, разрезаем ребро
          const split = createNode(next.start, next.start + activeLength);
          activeNode.children.set(s[activeEdge]!, split);
          split.children.set(s[pos]!, createNode(pos, LEAF_END));
          next.start += activeLength;
          split.children.set(s[next.start]!, next);
          this.count += 2;

          if (lastNew) lastNew.link = split;
          lastNew = split;
        }

        remainder--;

        if (activeNode === this.root && activeLength > 0) {
          activeLength--;
          activeEdge = pos - remainder + 1;
        } else {
          activeNode = activeNode.link ?? this.root;
        }
      }
    }
  }

  // считаем глубину и номера суффиксов
  private computeDepths(): void {
    const n = this.symbols.length;
    const stack = [this.root];

    while (stack.length > 0) {
      const node = stack.pop()!;
      for (const child of node.children.values()) {
        if (child.end === Infinity) child.end = n;
        child.depth = node.depth + child.end - child.start;
        if (child.children.size === 0) child.suffix = n - child.depth;
        stack.push(child);
      }
    }
  }

  // вывод дерева текстом
  toString(): string {
    const lines: string[] = [];
    const show = (code: number) => (code < 0 ? "$" : String.fromCodePoint(code));

    const walk = (node: SuffixTreeNode, indent: string) => {
      const children = [...node.children.values()].sort((a, b) => this.symbols[a.start]! - this.symbols[b.start]!);
      for (const child of children) {
        const label = this.symbols.slice(child.start, child.end).map(show).join("");
        lines.push(`${indent}${label}${child.suffix !== -1 ? ` (${child.suffix})` : ""}`);
        walk(child, indent + "  ");
      }
    };

    walk(this.root, "");
    return lines.join("\n");
  }
}
