const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Función para normalizar las cadenas eliminando tildes y caracteres especiales
function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos (tildes y otros)
    .replace(/[¿?]/g, ''); // Elimina signos de interrogación
}

// Ruta para manejar las consultas del bot
app.post('/api/chat', (req, res) => {
  // Normaliza la consulta del usuario
  let userMessage = normalizeString(req.body.message);

  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer los datos.' });
    }

    const jsonData = JSON.parse(data);

    // Busca la pregunta normalizando y comparando
    const response = jsonData.questions.find(q => 
      normalizeString(q.question) === userMessage
    );

    if (response) {
      res.json({ reply: response.answer });
    } else {
      res.json({ reply: 'Lo siento, no entendí tu consulta.' });
    }
  });
});

// Ruta para añadir nuevas preguntas (para entrenamiento futuro)
app.post('/api/add-question', (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Pregunta y respuesta son requeridas.' });
  }

  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer los datos.' });
    }

    const jsonData = JSON.parse(data);
    jsonData.questions.push({ question: question.toLowerCase(), answer });

    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al guardar los datos.' });
      }
      res.json({ message: 'Pregunta añadida exitosamente.' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
