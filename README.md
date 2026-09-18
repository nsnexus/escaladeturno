# 🌿 Sistema de Escala de Turno Operacional • HC Ambiental

Sistema moderno, corporativo e de alta performance para gestão e exibição pública de escalas de turno para as operações **Área Sossego (3 Caminhões)** e **Área Salobo (4 Caminhões)**, estruturado de acordo com a identidade visual da **HC Ambiental**.

---

## 🚀 Destaques e Recursos do Sistema

1. **Tela de Apresentação / Display TV (`index.html`)**:
   - **Identidade Visual HC Ambiental**: Paleta exclusiva em tons de verde ecológico (`#00a651`) e azul corporativo (`#3a5bc4`), padrão de tema claro moderno, alta legibilidade e iconografia Font Awesome 6.
   - **Relógio Operacional em Tempo Real**: Exibe hora com segundos, dia por extenso e indicação automática do turno ativo (Diurno das 07h às 19h / Noturno das 19h às 07h).
   - **Frotas & Duplas Operacionais**: Cartões detalhados para cada caminhão (3 em Sossego e 4 em Salobo), exibindo Motorista (com destaque para Carteira Mina), Ajudante de Motorista, modelo do veículo, placa e rota.
   - **Quadro do Efetivo do Dia**: Divisão inteligente em tempo real entre quem está em turno (3x3 ativo), equipe administrativa (ADM comercial) e colaboradores em folga, férias ou licença.
   - **Grade Mensal Interativa**: Calendário completo de 30/31 dias com color-coding por status (Trabalho, Folga, Férias, Atestado, Treinamento) e destaque para o dia de hoje.
   - **Modo Apresentação TV (Auto-Play)**: Rotação automática de visualizações e abas a cada 15 segundos para TVs instaladas em refeitórios, portarias e salas de controle.
   - **Modo Tela Cheia (Fullscreen)** e **Impressão Oficial / PDF** com formatação em folha A4/A3 para murais físicos e assinaturas de supervisão.

2. **Painel Administrativo de Gestão (`admin.html`)**:
   - **Gestão Completa de Efetivo (CRUD)**: Adicione, edite, filtre e exclua colaboradores.
   - **Alocação de Caminhões & Frotas**: Troque motoristas e ajudantes de cada caminhão com 1 clique, com validação de Carteira Mina para rotas de mina.
   - **Ajuste Fino de Escalas**:
     - **Troca Rápida (Swap)**: Permute a escala entre dois colaboradores instantaneamente.
     - **Lançamento de Exceções**: Registre folgas compensatórias, atestados ou férias em dias específicos.
     - **Parâmetros do Ciclo 3x3**: Ajuste a data-base de revezamento das turmas A e B.
   - **Backup & Segurança**: Exportação/Importação em arquivo JSON e botão para restaurar os dados originais das planilhas oficiais.
   - **Exportação CSV**: Relatório pronto para abrir no Excel.

3. **Banco de Dados Híbrido (Firebase Firestore + LocalStorage)**:
   - **Modo Offline Imediato**: Funciona 100% no navegador sem exigir nenhuma configuração prévia.
   - **Sincronização em Tempo Real (Firebase Firestore)**: Conecte o Firebase para que alterações feitas no Admin reflitam instantaneamente na TV sem precisar atualizar a página.

---

## 📁 Estrutura de Arquivos

```
escala de turno/
├── index.html              # Tela de Apresentação / Display TV
├── admin.html              # Painel Administrativo de Gestão
├── css/
│   ├── style.css           # Design System principal (Dark Industrial, Neon, Glassmorphism)
│   ├── admin.css           # Estilos dedicados do Painel Administrativo
│   └── print.css           # Estilos otimizados para impressão/PDF de murais
├── js/
│   ├── data-initial.js     # 36 colaboradores e frotas originais de Sossego e Salobo
│   ├── firebase-config.js  # Gerenciador de conexão Firebase Firestore
│   ├── storage.js          # Camada DAL unificada (LocalStorage + Firestore Realtime)
│   ├── app.js              # Controlador da Tela de Apresentação
│   └── admin.js            # Controlador do Painel Administrativo
├── _headers                # Cabeçalhos de segurança e cache para o Cloudflare Pages
├── .gitignore              # Arquivos ignorados pelo Git
└── README.md               # Documentação técnica e de deploy
```

---

## ⚙️ Como Conectar ao Firebase Firestore

1. Acesse o [Console do Firebase](https://console.firebase.google.com) com sua conta Google.
2. Crie um novo projeto (ex: `escala-turno-mineracao`).
3. No menu lateral, acesse **Build > Firestore Database** e clique em **Criar banco de dados**.
4. Inicie em **Modo de Teste** (ou configure as regras de segurança abaixo).
5. Vá em **Configurações do Projeto** (ícone de engrenagem no topo) > **Geral** > Role até **Seus aplicativos** e adicione um aplicativo **Web** (`</>`).
6. Copie os campos do objeto `firebaseConfig`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
7. Abra o **Painel Administrativo** (`admin.html`), vá na aba **Nuvem & Firebase**, cole as chaves e clique em **Salvar Configurações do Firebase**.
8. Pronto! O sistema passará a sincronizar automaticamente entre todos os dispositivos conectados.

### Regras recomendadas para o Firestore (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /escala_operacional/{document=**} {
      allow read, write: if true; // Para uso operacional interno ou adapte para autenticação
    }
  }
}
```

---

## 🌐 Como Subir no GitHub e Fazer Deploy no Cloudflare Pages

### Passo 1: Subir no GitHub
No terminal da pasta do projeto:
```bash
git init
git add .
git commit -m "feat: Sistema de Escala de Turno Sossego e Salobo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

### Passo 2: Deploy no Cloudflare Pages
1. Acesse o [Painel do Cloudflare](https://dash.cloudflare.com/) e faça login.
2. No menu lateral esquerdo, clique em **Workers & Pages** > **Create application** > aba **Pages**.
3. Selecione **Connect to Git** e escolha o repositório que você acabou de subir.
4. Defina as configurações de build:
   - **Project name**: `escala-turno` (ou o nome de sua preferência)
   - **Production branch**: `main`
   - **Framework preset**: `None`
   - **Build command**: *(deixe em branco)*
   - **Build output directory**: `/` *(diretório raiz do projeto)*
5. Clique em **Save and Deploy**.
6. Em menos de 1 minuto, seu sistema estará online com certificado SSL/HTTPS gratuito e alta velocidade global!

---

## 👥 Dados Oficiais Integrados

- **Área Sossego**: 18 Colaboradores oficiais, 3 Caminhões ativos, Encarregado Divino Soares dos Santos.
- **Área Salobo**: 18 Colaboradores oficiais, 4 Caminhões ativos, Supervisão Pedro Reis de Almeida.
- **Total Inicial**: 36 Colaboradores cadastrados com matrículas, cargos, turnos e status de Carteira Mina.
