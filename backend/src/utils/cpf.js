function normalizarCpf(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function cpfValido(valor) {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = tamanho => {
    let soma = 0;
    for (let indice = 0; indice < tamanho; indice += 1) {
      soma += Number(cpf[indice]) * (tamanho + 1 - indice);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(9) === Number(cpf[9])
    && calcularDigito(10) === Number(cpf[10]);
}

function exigirCpfValido(valor) {
  const cpf = normalizarCpf(valor);
  if (!cpf) {
    throw new Error('Informe o CPF no Meu Perfil antes de gerar uma nova cobranca.');
  }
  if (!cpfValido(cpf)) {
    throw new Error('O CPF informado no Meu Perfil nao e valido. Confira os 11 numeros.');
  }
  return cpf;
}

module.exports = {
  normalizarCpf,
  cpfValido,
  exigirCpfValido,
};
