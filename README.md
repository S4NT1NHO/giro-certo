# Giro Certo — publicar na Vercel com Supabase

Esta é uma versão separada, preparada para Next.js na Vercel. A versão antiga permanece no endereço anterior. O banco novo ainda precisa ser instalado na sua conta.

## 1. Criar as tabelas
No projeto giro-certo do Supabase, abra SQL Editor, crie uma consulta e execute o conteúdo destes arquivos, nesta ordem:

1. supabase/01-instalar.sql — tabelas, perfis, restrições e armazenamento privado de fotos. Execute uma vez, em projeto novo.
2. supabase/02-sessoes.sql — encerra o acesso das sessões anteriores após troca de senha ou desativação. Pode ser reaplicado.

Os arquivos estão dentro do ZIP. Se você já executou o primeiro arquivo enviado na conversa, execute somente o segundo. Não é necessário recriar o projeto. Não altere os arquivos para contornar erros: envie a mensagem de erro para avaliarmos.

## 2. Guardar o código no GitHub
Crie um repositório privado chamado giro-certo. Extraia Giro-Certo-Vercel.zip e envie as pastas e arquivos extraídos para a raiz desse repositório. O arquivo package.json deve aparecer na primeira tela do repositório, junto das pastas app e lib.

Não envie o próprio ZIP como único arquivo. Não envie node_modules, .next, .env.local ou chaves secretas. O ZIP fornecido já exclui esses itens.

## 3. Configurar a Vercel
Abra Add New → Project, importe giro-certo do GitHub e selecione o framework Next.js.

Mantenha a pasta raiz que contém package.json e o comando de build definido pelo projeto: npm run build. A compilação usa Next.js com webpack. Use Node.js 22 ou superior, conforme as versões oferecidas pela Vercel.

Em Environment Variables, configure:

| Nome | Valor |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | https://ycdgdzqdddgnguuzjgif.supabase.co |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | A Publishable key que você copiou do Supabase, também presente em .env.example |
| SUPABASE_SECRET_KEY | A chave secreta do seu projeto, copiada em Supabase → Settings → API Keys |

A terceira chave começa com sb_secret_. Cole diretamente no campo da Vercel e trate como variável sensível. Não coloque no GitHub e não envie em prints ou na conversa. Ela é utilizada somente no servidor para localizar o usuário de login, limitar tentativas e gerenciar contas. As consultas de clientes, serviços, gastos e fotos usam a sessão da pessoa e as regras do banco.

Configure as variáveis no ambiente Production. Se usar Preview, configure também ali, sabendo que a prévia apontará para o mesmo banco. Uma alteração de variáveis exige uma nova publicação.

Clique Deploy e guarde o endereço que a Vercel gerar.

## 4. Configurar o endereço de retorno do login
No Supabase, abra Authentication → URL Configuration.

- Site URL: endereço HTTPS do Giro Certo publicado na Vercel.
- Redirect URLs: acrescente esse mesmo endereço seguido de /auth/callback.
- Para testar no computador, acrescente http://localhost:3000/auth/callback.

Use endereços exatos. Ao adotar domínio próprio, atualize essas configurações também.

## 5. Criar sua conta e gerenciar usuários
Abra o novo app, escolha Criar conta e informe nome, e-mail, usuário e senha. Confirme seu e-mail e entre.

Para transformar sua conta em administrador, abra supabase/03-administrador.sql. Troque SEU_EMAIL_AQUI pelo e-mail que você acabou de confirmar e execute no SQL Editor. Atualize a página do app. A aba Usuários permitirá cadastrar pessoas, redefinir senhas e desativar acessos.

O cadastro comum sempre cria uma conta normal. Ninguém se torna administrador por escolher um nome de usuário ou enviar uma opção no formulário. Não há código de ativação nesta versão.

## 6. E-mails de confirmação
A confirmação de e-mail está ativa no seu Supabase. O serviço padrão de envio é limitado e aceita apenas endereços da equipe do projeto. Para permitir cadastro público de outras pessoas, configure um provedor SMTP em Authentication antes de divulgar o cadastro. Isso pode exigir uma conta adicional e configuração do remetente.

Enquanto configura o SMTP, o administrador pode criar as contas pela aba Usuários: define a senha inicial e informa pessoalmente ao usuário. Esse cadastro administrativo não envia convite por e-mail.

Documentação: https://supabase.com/docs/guides/auth/auth-smtp

A recuperação de senha continua sendo feita pelo administrador na aba Usuários. Todos podem trocar a própria senha usando o ícone de chave no app. Senhas são gerenciadas pelo Supabase Auth; nenhuma tabela do app armazena senha em texto.

## 7. Testar antes de usar no trabalho
Entre com duas contas diferentes. Crie um cliente e um serviço com foto em uma conta e confirme que eles não aparecem na outra. Lance um gasto e confira o saldo do mês. Teste sair, entrar novamente, trocar a senha e desativar uma conta pelo administrador.

Fotos aceitas: JPG, PNG e WebP, até 3 MB. Esse limite mantém o envio dentro do tamanho aceito pelas funções da Vercel. O arquivo fica em um bucket privado.

## 8. Rodar no computador
Instale Node.js 22 ou superior. Na pasta extraída, rode npm ci. Copie .env.example para .env.local e preencha SUPABASE_SECRET_KEY somente nessa cópia local. Rode npm run dev e abra http://localhost:3000.

Comandos de verificação: npm test, npm run typecheck e npm run build.

## Dados anteriores e planos
Os clientes, serviços, fotos e contas do endereço antigo não são transferidos automaticamente. O ZIP contém somente o aplicativo e os scripts do banco, sem os dados do sistema anterior. Uma migração dos registros precisa ser feita separadamente; as senhas antigas não são importadas para o Supabase Auth.

A Vercel limita o plano Hobby ao uso pessoal e não comercial. Como o app será usado no trabalho de motoboy, confira o plano apropriado antes de depender dele profissionalmente. Supabase e Vercel têm limites e condições próprios; esta configuração não garante hospedagem gratuita ou vitalícia.

Referências: https://vercel.com/docs/plans/hobby e https://supabase.com/docs/guides/auth/server-side/nextjs

## O que já foi verificado
O banco é testado localmente com PostgreSQL em PGlite, incluindo RLS, impedimento de promoção de usuário, vínculos entre clientes e serviços, bloqueio de sessões antigas e fotos privadas. A conexão pública com seu projeto foi confirmada. O teste completo na sua hospedagem depende dos scripts SQL, da chave secreta no servidor e das configurações de autenticação da sua conta.
