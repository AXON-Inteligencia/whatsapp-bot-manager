export function chunkText(text: string): string[] {
  // Limpar artefatos comuns de PDF
  let cleanedText = text
    .replace(/\n{3,}/g, '\n\n') // Remover quebras de linha excessivas
    .replace(/^\d+$/gm, '')      // Remover linhas que são apenas números (ex: número de página)
    .trim();

  // Opcional: remover cabeçalhos repetidos seria complexo sem NLP, 
  // mas as duas expressões regulares acima já resolvem 90% dos lixos de PDF.

  const chunkSize = 2000;
  const chunkOverlap = 200;

  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;

    // Se não for o último chunk, tenta não cortar palavras no meio
    if (endIndex < cleanedText.length) {
      // Tenta achar o último espaço ou quebra de linha antes do endIndex
      const lastSpaceIndex = cleanedText.lastIndexOf(' ', endIndex);
      const lastNewlineIndex = cleanedText.lastIndexOf('\n', endIndex);

      const breakIndex = Math.max(lastSpaceIndex, lastNewlineIndex);

      // Se achou um separador razoável dentro do overlap aceitável
      if (breakIndex > startIndex + chunkSize - chunkOverlap) {
        endIndex = breakIndex;
      }
    }

    chunks.push(cleanedText.substring(startIndex, endIndex).trim());

    // Avança o start index recuando o overlap
    startIndex = endIndex - chunkOverlap;
  }

  return chunks;
}
