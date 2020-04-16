export function randString(length = 10, alphabet = "qwertyuiopasdfghjklzxcvbnm") {
    return [...Array(length)]
        .map(() => alphabet.charAt(Math.trunc(Math.random() * alphabet.length)))
        .reduce((acc, cur) => acc + cur);
}
