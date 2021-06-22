import express from 'express';
import cors from 'cors';
import pg from 'pg';
import Joi from 'joi';
import checkIfCategoryExists from './checkIfCategoryExists.js';


const server = express();
server.use(cors());
server.use(express.json());

const {Pool} = pg;

const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
});

const categoriesSchema = Joi.object({
    name: Joi.string().required()
})

const gamesSchema = Joi.object({
    name: Joi.string().required(),
    image: Joi.string().pattern(new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?' + // fragment locator
    '(\\.(jpe?g|png|gif|bmp))$' // extensions
    ,'i')), 
    stockTotal: Joi.number().integer().min(1).required(),
    categoryId: Joi.number().integer().required(),
    pricePerDay: Joi.number().integer().min(1).required()

})


server.get('/categories', async (req,res) => {
    const categories = await connection.query('SELECT * FROM categories');
    res.send(categories.rows);
})

server.post('/categories', async (req,res) => {
    const {error} = categoriesSchema.validate(req.body);
    if(!error){
        const categoriesNames = await connection.query("SELECT * FROM categories");
        if(categoriesNames.rows.length !== 0){
            for(let i = 0; i < categoriesNames.rows.length; i++){
                if(categoriesNames.rows[i].name === req.body.name){
                    res.sendStatus(409);
                    return;
                }
            }
        }
        try {
            const insertNewCategorie = await connection.query("INSERT INTO categories(name) VALUES ($1)",[req.body.name]);
            res.sendStatus(201);
        } catch {
            res.sendStatus(500);
        }

    } else {
        res.sendStatus(400);
    }
    
})

server.get('/games', async (req,res) => {
    if(!req.query.name){
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id`);
        res.send(games.rows);
    } else {
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE LOWER(games.name) LIKE $1`,[req.query.name + '%']);
        res.send(games.rows);
    }
})

server.post('/games', async (req,res) => {
    const {error} = gamesSchema.validate(req.body);
    if(!error){
        const gamesCategories = await connection.query("SELECT * FROM categories");
        if(checkIfCategoryExists(req.body, gamesCategories.rows)){
            const {name,image,stockTotal,categoryId,pricePerDay} = req.body;
            const gamesNames = await connection.query("SELECT * FROM games");
            if(gamesNames.rows.length !== 0){
                for(let i = 0; i < gamesNames.rows.length; i++){
                    if(gamesNames.rows[i].name === req.body.name){
                        res.sendStatus(409);
                        return;
                    }
                }
            }
            const insertNewGame = await connection.query(`INSERT INTO games(name,image,"stockTotal","categoryId","pricePerDay") VALUES ($1,$2,$3,$4,$5)`,[name,image,stockTotal,categoryId,pricePerDay])
            res.sendStatus(201);
            return;
        }
        res.sendStatus(400);
        return;
    }
    res.sendStatus(400);
})

server.listen(4000);