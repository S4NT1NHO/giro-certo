export class RequestError extends Error{constructor(message:string,public status=400){super(message);}}
export function checkDatabase(error:{code?:string;message:string}|null){
 if(!error)return;
 if(error.code==='23505')throw new RequestError('Este usuário, e-mail ou registro já está cadastrado.',409);
 if(error.code==='23503')throw new RequestError('Este registro está vinculado a outro cadastro. Preserve ou remova os serviços vinculados primeiro.',409);
 if(error.code==='42501')throw new RequestError('Você não tem permissão para acessar este registro.',403);
 if(error.code==='23514')throw new RequestError('Confira os campos informados.');
 console.error('Database operation failed',error.code);
 throw new RequestError('Não foi possível acessar os registros. Confira a conexão e tente novamente.',503);
}
