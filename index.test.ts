import { describe, expect, test } from "bun:test";
import { SuffixTree } from "./src/suffixTree.ts";
import { longestPalindrome } from "./src/palindrome.ts";

const randomString = (n: number, alphabet = "ab") =>
  Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

// все вхождения перебором
function naiveOccurrences(text: string, pattern: string): number[] {
  const result: number[] = [];
  for (let i = 0; i + pattern.length <= text.length; i++) {
    if (text.slice(i, i + pattern.length) === pattern) result.push(i);
  }
  return result;
}

// самый длинный палиндром перебором, первый слева
function naivePalindrome(s: string): string {
  let best = "";
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j <= s.length; j++) {
      const sub = s.slice(i, j);
      if (sub.length > best.length && sub === [...sub].reverse().join("")) best = sub;
    }
  }
  return best;
}

describe("SuffixTree", () => {
  const tree = new SuffixTree("abracadabra");

  test("находит подстроки", () => {
    ["abra", "cad", "a", "bracadabra", "abracadabra", "ra"].forEach((p) => expect(tree.includes(p)).toBe(true));
  });
  test("не находит то, чего нет", () => {
    ["abc", "dab a", "abracadabraa", "z"].forEach((p) => expect(tree.includes(p)).toBe(false));
  });
  test("все вхождения", () => {
    expect(tree.occurrences("abra")).toEqual([0, 7]);
    expect(tree.occurrences("a")).toEqual([0, 3, 5, 7, 10]);
    expect(tree.occurrences("cad")).toEqual([4]);
    expect(tree.occurrences("x")).toEqual([]);
  });
  test("пустая строка и пустой образец", () => {
    expect(new SuffixTree("").includes("a")).toBe(false);
    expect(new SuffixTree("").occurrences("")).toEqual([]);
    expect(tree.includes("")).toBe(true);
  });
  test("узлов не больше 2n", () => {
    const text = randomString(1000, "abc");
    expect(new SuffixTree(text).nodeCount).toBeLessThanOrEqual(2 * (text.length + 1));
  });
  test("совпадает с перебором на случайных строках", () => {
    for (let t = 0; t < 50; t++) {
      const text = randomString(60, "abc");
      const st = new SuffixTree(text);
      for (let q = 0; q < 20; q++) {
        const pattern = randomString(1 + Math.floor(Math.random() * 4), "abc");
        expect(st.occurrences(pattern)).toEqual(naiveOccurrences(text, pattern));
      }
    }
  });
  test("строки из одной буквы", () => {
    expect(new SuffixTree("aaaa").occurrences("aa")).toEqual([0, 1, 2]);
  });
  test("русские буквы, спецсимволы и эмодзи", () => {
    const st = new SuffixTree("мама#мыла$раму😀!");
    expect(st.includes("ла$ра")).toBe(true);
    expect(st.includes("му😀")).toBe(true);
    expect(st.occurrences("ма")).toEqual([0, 2]);
  });
  test("длинная строка не падает", () => {
    const st = new SuffixTree("ab".repeat(50000));
    expect(st.occurrences("ba").length).toBe(49999);
  });
  test("вывод дерева", () => {
    expect(new SuffixTree("aba").toString()).toBe(["$ (3)", "a", "  $ (2)", "  ba$ (0)", "ba$ (1)"].join("\n"));
  });
});

describe("longestPalindrome", () => {
  test("примеры", () => {
    expect(longestPalindrome("abacaba")).toBe("abacaba");
    expect(longestPalindrome("babad")).toBe("bab");
    expect(longestPalindrome("cbbd")).toBe("bb");
    expect(longestPalindrome("forgeeksskeegfor")).toBe("geeksskeeg");
  });
  test("пустая строка и одна буква", () => {
    expect(longestPalindrome("")).toBe("");
    expect(longestPalindrome("x")).toBe("x");
  });
  test("нет палиндромов длиннее 1 - первая буква", () => {
    expect(longestPalindrome("abcd")).toBe("a");
  });
  test("одинаковые буквы", () => {
    expect(longestPalindrome("aaaa")).toBe("aaaa");
    expect(longestPalindrome("aaa")).toBe("aaa");
  });
  test("русская фраза без пробелов", () => {
    expect(longestPalindrome("ааарозаупаланалапуазорабб")).toBe("арозаупаланалапуазора");
  });
  test("символы # и $ в строке не мешают", () => {
    expect(longestPalindrome("x#$#y")).toBe("#$#");
  });
  test("эмодзи", () => {
    expect(longestPalindrome("a😀b😀c")).toBe("😀b😀");
  });
  test("совпадает с перебором на случайных строках", () => {
    for (let t = 0; t < 300; t++) {
      const s = randomString(1 + Math.floor(Math.random() * 40), t % 2 ? "ab" : "abc");
      expect(longestPalindrome(s)).toBe(naivePalindrome(s));
    }
  });
  test("длинная строка работает быстро", () => {
    const s = randomString(100000, "ab") + "x".repeat(1000);
    const start = performance.now();
    expect(longestPalindrome(s).length).toBeGreaterThanOrEqual(1000);
    expect(performance.now() - start).toBeLessThan(5000);
  });
});
