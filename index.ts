import { SuffixTree } from "./src/suffixTree.ts";
import { longestPalindrome } from "./src/palindrome.ts";

function runSearch() {
  const text = prompt("Введите строку:") ?? "";
  const tree = new SuffixTree(text);
  console.log(`Дерево построено, узлов: ${tree.nodeCount}`);

  while (true) {
    const pattern = prompt("Что ищем? (пустая строка - назад)") ?? "";
    if (pattern === "") break;

    const positions = tree.occurrences(pattern);
    if (positions.length === 0) {
      console.log(`"${pattern}" не найдено`);
    } else {
      console.log(`"${pattern}" найдено, вхождений: ${positions.length}, позиции: ${positions.join(", ")}`);
    }
  }
}

function runShow() {
  const text = prompt("Введите короткую строку, например banana:") ?? "";
  if (text.length > 30) {
    console.log("Строка длинная, дерево будет большим. Лучше до 30 символов");
    return;
  }
  console.log("$ - конец строки, в скобках номер суффикса");
  console.log(new SuffixTree(text).toString());
}

function runPalindrome() {
  const text = prompt("Введите строку:") ?? "";
  if (text === "") {
    console.log("Ошибка: строка пустая");
    return;
  }
  const result = longestPalindrome(text);
  console.log(`Самый длинный палиндром: "${result}", длина ${Array.from(result).length}`);
}

while (true) {
  console.log("1 - Поиск подстроки через суффиксное дерево");
  console.log("2 - Показать суффиксное дерево");
  console.log("3 - Самый длинный палиндром");
  console.log("0 - Выход");

  const choice = prompt("Выберите пункт:");

  if (choice === "1") runSearch();
  else if (choice === "2") runShow();
  else if (choice === "3") runPalindrome();
  else if (choice === "0" || choice === null) break;
  else console.log("Нет такого пункта");
}
