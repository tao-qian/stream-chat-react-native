import { find } from 'linkifyjs';

interface LinkInfo {
  raw: string;
  url: string;
}

/**
 * This is done separately because of the version of javascript run
 * for expo
 * */
const removeMarkdownLinksFromText = (input: string) => input.replace(/\[[\w\s]+\]\(.*\)/g, '');

/**
 * This is done to avoid parsing usernames with dot as well as an email address in it.
 */
const removeUserNamesWithEmailFromText = (input: string) =>
  input.replace(/@(\w+(\.\w+)?)(@\w+\.\w+)/g, '');

export const parseLinksFromText = (input: string): LinkInfo[] => {
  const strippedInput = [removeMarkdownLinksFromText, removeUserNamesWithEmailFromText].reduce(
    (acc, fn) => fn(acc),
    input,
  );

  const links = find(strippedInput, 'url');
  const emails = find(strippedInput, 'email');

  const result: LinkInfo[] = [...links, ...emails].map(({ href, value }) => ({
    raw: value,
    url: href,
  }));

  return result;
};
