/* node gerar-hash.mjs "senha"  -> imprime o valor de EQUIPE_SENHA_HASH */
import { criarHash } from './equipe-api.mjs';
console.log(await criarHash(process.argv[2] || ''));
