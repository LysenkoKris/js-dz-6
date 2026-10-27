// Самый длинный палиндром через суффиксное дерево
//
// Палиндром с центром в i читается одинаково вправо и влево от i.
// Вправо от i - это суффикс строки S, а влево - суффикс перевёрнутой строки R.
// Значит надо найти, сколько букв у этих суффиксов совпадает в начале.
//
// Как работает: строим одно дерево для S + # + R + $.
// Сколько букв совпадает у двух суффиксов - это глубина их общего предка в дереве.
// Чтобы находить её быстро, обходим дерево и делаем sparse table.
// Потом проверяем каждый центр, и чётные, и нечётные.
//
// Сложность:
// - дерево O(n)
// - sparse table O(n log n)
// - проверка центров O(n)
// - итого O(n log n), память O(n log n)
//
// Перебором было бы O(n^3).

import { END, SuffixTree, type SuffixTreeNode } from "./suffixTree.ts";

const SEPARATOR = -2;

export function longestPalindrome(str: string): string {
  const s = Array.from(str, (ch) => ch.codePointAt(0)!);
  const n = s.length;
  if (n === 0) return "";

  const t = [...s, SEPARATOR, ...[...s].reverse(), END];
  const tree = new SuffixTree(t);
  const lce = buildLce(tree, t.length);

  let bestStart = 0;
  let bestLength = 1;

  for (let i = 0; i < n; i++) {
    // чётный, центр между i - 1 и i
    if (i > 0) {
      const k = lce(i, 2 * n + 1 - i);
      if (2 * k > bestLength) {
        bestLength = 2 * k;
        bestStart = i - k;
      }
    }

    // нечётный, центр в i
    const k = lce(i, 2 * n - i);
    if (2 * k - 1 > bestLength) {
      bestLength = 2 * k - 1;
      bestStart = i - k + 1;
    }
  }

  return s.slice(bestStart, bestStart + bestLength).map((code) => String.fromCodePoint(code)).join("");
}

// функция: сколько букв совпадает у суффиксов с позиций a и b
function buildLce(tree: SuffixTree, size: number): (a: number, b: number) => number {
  const rank = new Int32Array(size); // номер листа по порядку
  const between = new Int32Array(size); // глубина общего предка соседних листьев

  // обход без рекурсии, чтобы не упасть на длинной строке
  let r = 0;
  let minDepth = Infinity;
  const stack: { node: SuffixTreeNode; children: SuffixTreeNode[]; i: number }[] = [
    { node: tree.root, children: [...tree.root.children.values()], i: 0 },
  ];

  while (stack.length > 0) {
    const top = stack[stack.length - 1]!;
    minDepth = Math.min(minDepth, top.node.depth);

    if (top.node.suffix !== -1) {
      // дошли до листа
      rank[top.node.suffix] = r;
      if (r > 0) between[r] = minDepth;
      r++;
      minDepth = Infinity;
      stack.pop();
      continue;
    }

    if (top.i < top.children.length) {
      const child = top.children[top.i++]!;
      stack.push({ node: child, children: [...child.children.values()], i: 0 });
    } else {
      stack.pop();
    }
  }

  // sparse table: минимумы на отрезках длины 1, 2, 4, 8...
  const table: Int32Array[] = [between];
  for (let j = 1; 1 << j <= size; j++) {
    const prev = table[j - 1]!;
    const half = 1 << (j - 1);
    const cur = new Int32Array(size - (1 << j) + 1);
    for (let x = 0; x < cur.length; x++) {
      cur[x] = Math.min(prev[x]!, prev[x + half]!);
    }
    table.push(cur);
  }

  return (a, b) => {
    let left = rank[a]!;
    let right = rank[b]!;
    if (left > right) [left, right] = [right, left];

    // минимум между двумя листьями
    left++;
    const j = Math.floor(Math.log2(right - left + 1));
    return Math.min(table[j]![left]!, table[j]![right - (1 << j) + 1]!);
  };
}
