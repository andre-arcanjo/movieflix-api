var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { PrismaClient } from './generated/prisma/index.js';
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
const port = 3000;
const app = express();
const prisma = new PrismaClient();
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/movies', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const movies = yield prisma.movies.findMany({
        orderBy: {
            title: 'asc',
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
}));
app.post('/movies', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body;
    try {
        const movieWithSameTitle = yield prisma.movies.findFirst({
            where: { title: { equals: title, mode: 'insensitive' } },
        });
        if (movieWithSameTitle) {
            return res
                .status(409)
                .send('Já existe um filme cadastrado com esse título');
        }
        yield prisma.movies.create({
            data: {
                title: title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });
    }
    catch (error) {
        return res.status(500).send({ message: 'Falha ao cadastrar filme' });
    }
    res.status(201).send();
}));
app.put('/movies/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
        const movie = yield prisma.movies.findUnique({
            where: {
                id,
            },
        });
        if (!movie) {
            return res.status(404).send({ message: 'Filme não encontrado' });
        }
        const data = Object.assign({}, req.body);
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;
        yield prisma.movies.update({
            where: {
                id,
            },
            data: data,
        });
    }
    catch (error) {
        return res
            .status(500)
            .send({ message: 'Falha ao atualizar o registro do filme' });
    }
    res.status(200).send();
}));
app.delete('/movies/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
        const movie = yield prisma.movies.findUnique({
            where: {
                id,
            },
        });
        if (!movie) {
            return res.status(404).send({ message: 'Filme não encontrado' });
        }
        yield prisma.movies.delete({
            where: {
                id,
            }
        });
    }
    catch (error) {
        return res.status(500).send({ message: 'Não foi possível remover o filme' });
    }
    res.status(200).send();
}));
app.get('/movies/:genreName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const moviesFilteredGenreName = yield prisma.movies.findMany({
            include: {
                genres: true,
                languages: true
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: 'insensitive'
                    }
                }
            }
        });
        res.status(200).send(moviesFilteredGenreName);
    }
    catch (error) {
        return res.status(500).send({ message: 'Falha ao filtrar filmes por gênero' });
    }
}));
app.listen(port, () => {
    console.log(`Servidor em execução em: http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map