// app.js
const express = require("express");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const app = express();
app.use(express.json());

// Constantes
const SEGREDO_TOKEN = "segredo_super_secreto";
const PARTICIPANTES = [];
const SORTEIO = {};

// Configuração Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API Amigo Secreto",
      version: "1.0.0",
      description: "API para gerenciar sorteio de amigo secreto",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./app.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/documentacao", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware de segurança
function autenticarToken(req, res, next) {
  const cabecalho = req.headers["authorization"];
  const token = cabecalho && cabecalho.split(" ")[1];
  if (!token) return res.status(401).json({ erro: "Token não fornecido" });

  jwt.verify(token, SEGREDO_TOKEN, (err, usuario) => {
    if (err) return res.status(403).json({ erro: "Token inválido" });
    req.usuario = usuario;
    next();
  });
}

// Rotas

// Registrar participante
app.post("/registrar", (req, res) => {
  const { nome, email } = req.body;
  const id = PARTICIPANTES.length + 1;
  PARTICIPANTES.push({ id, nome, email });
  res.json({ mensagem: "Participante registrado com sucesso!", id });
});

// Login
app.post("/login", (req, res) => {
  const { email } = req.body;
  const participante = PARTICIPANTES.find((p) => p.email === email);
  if (!participante)
    return res.status(404).json({ erro: "Participante não encontrado" });

  const token = jwt.sign({ id: participante.id, email }, SEGREDO_TOKEN, {
    expiresIn: "1h",
  });
  res.json({ token });
});

// Listar participantes
app.get("/participantes", autenticarToken, (req, res) => {
  res.json(PARTICIPANTES);
});

// Sortear amigo secreto
app.post("/sortear", autenticarToken, (req, res) => {
  if (PARTICIPANTES.length < 3)
    return res
      .status(400)
      .json({ erro: "Precisa de pelo menos 3 participantes" });

  const ids = PARTICIPANTES.map((p) => p.id);
  const sorteados = [...ids];

  ids.forEach((id) => {
    let amigo;
    do {
      amigo = sorteados[Math.floor(Math.random() * sorteados.length)];
    } while (amigo === id);
    SORTEIO[id] = amigo;
    sorteados.splice(sorteados.indexOf(amigo), 1);
  });

  res.json({ mensagem: "Sorteio realizado com sucesso!" });
});

// Consultar meu amigo secreto
app.get("/meu-amigo", autenticarToken, (req, res) => {
  const amigoId = SORTEIO[req.usuario.id];
  if (!amigoId) return res.status(404).json({ erro: "Sorteio não realizado" });

  const amigo = PARTICIPANTES.find((p) => p.id === amigoId);
  res.json({ meuAmigoSecreto: amigo });
});

// Remover participante
app.delete("/participante/:id", autenticarToken, (req, res) => {
  const id = parseInt(req.params.id);
  const indice = PARTICIPANTES.findIndex((p) => p.id === id);
  if (indice === -1)
    return res.status(404).json({ erro: "Participante não encontrado" });

  PARTICIPANTES.splice(indice, 1);
  res.json({ mensagem: "Participante removido com sucesso!" });
});

// Atualizar participante
app.put("/participante/:id", autenticarToken, (req, res) => {
  const id = parseInt(req.params.id);
  const participante = PARTICIPANTES.find((p) => p.id === id);
  if (!participante)
    return res.status(404).json({ erro: "Participante não encontrado" });

  const { nome, email } = req.body;
  participante.nome = nome || participante.nome;
  participante.email = email || participante.email;
  res.json({ mensagem: "Participante atualizado com sucesso!", participante });
});

// Inicializar servidor
app.listen(3000, () => console.log("API Amigo Secreto rodando na porta 3000"));
