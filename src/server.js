import express from 'express';
import cors from 'cors';
import pg from 'pg';
import Joi from 'joi';
import {checkIfCategoryExists, getRentals} from './checkFunctions.js';


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

const categorySchema = Joi.object({
    name: Joi.string().required()
})

const gameSchema = Joi.object({
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

const customerSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(new RegExp('^[0-9]{10,11}$')).required(),
    cpf: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
    birthday: Joi.date().required()
})

const rentalSchema = Joi.object({
    customerId: Joi.number().integer().required(),
    gameId: Joi.number().integer().required(),
    daysRented: Joi.number().integer().min(1).required(),
})


server.get('/categories', async (req,res) => {
    const categories = await connection.query('SELECT * FROM categories');
    res.send(categories.rows);
})

server.post('/categories', async (req,res) => {
    const {error} = categorySchema.validate(req.body);
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
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE LOWER(games.name) LIKE LOWER($1)`,[req.query.name + '%']);
        res.send(games.rows);
    }
})

server.post('/games', async (req,res) => {
    const {error} = gameSchema.validate(req.body);
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

server.get('/customers', async (req,res) => {
    if(!req.query.cpf){
        const customers = await connection.query("SELECT * FROM customers");
        customers.rows.map(c => c.birthday = c.birthday.toISOString().substring(0,10));
        res.send(customers.rows);
    } else {
        const customers = await connection.query("SELECT * FROM customers WHERE cpf LIKE $1",[req.query.cpf + "%"]);
        customers.rows.map(c => c.birthday = c.birthday.toISOString().substring(0,10));
        res.send(customers.rows);
    }
})

server.get('/customers/:id', async (req,res) => {
    const customer = await connection.query(`SELECT * FROM customers WHERE id = $1`,[parseInt(req.params.id)]);
    customer.rows[0].birthday = customer.rows[0].birthday.toISOString().substring(0,10);
    (customer.rows.length > 0) ? res.send(customer.rows[0]) : res.sendStatus(404);  
})

server.post('/customers', async (req,res) => {
    const {error} = customerSchema.validate(req.body);
    if(!error){
        const {name,phone,cpf,birthday} = req.body;
        const customers = await connection.query("SELECT * FROM customers");
        if(customers.rows.length > 0){
            for(let i = 0; i < customers.rows.length; i++){
                if(customers.rows[i].cpf === req.body.cpf){
                    res.sendStatus(409);
                    return;
                }
            }
        }
        const insertNewCustomer = await connection.query(`INSERT INTO customers(name,phone,cpf,birthday) VALUES ($1,$2,$3,$4)`,[name,phone,cpf,birthday]);
        res.sendStatus(201);
    } else {
        res.sendStatus(400);
    }
})

server.put('/customers/:id', async (req,res) => {
    const {error} = customerSchema.validate(req.body);
    if(!error){
        const customers = await connection.query("SELECT * FROM customers");
        if(customers.rows.length > 0){
            for(let i = 0; i < customers.rows.length; i++){
                if(customers.rows[i].cpf === req.body.cpf){
                    res.sendStatus(409);
                    return;
                }
            }
        }
        const {name,phone,cpf,birthday} = req.body;
        const updateCustomer = await connection.query(`UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5`,[name,phone,cpf,birthday,req.params.id]);
        res.sendStatus(200);
    
    } else {
        res.sendStatus(400);
    }
})


server.get('/rentals', async (req,res) => {
    
    if(!req.query.customerId && !req.query.gameId){
        const rentals = await connection.query("SELECT * FROM rentals");
        const customers = await connection.query("SELECT * FROM customers");
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id`);
        
        getRentals(rentals,games,customers);
        res.send(rentals.rows)

    } else if(!!req.query.customerId && !!req.query.gameId){
        const rentals = await connection.query(`SELECT * FROM rentals WHERE "customerId" = $1 AND "gameId" = $2`,[req.query.customerId, req.query.gameId]);
        const customers = await connection.query("SELECT * FROM customers WHERE id = $1",[req.query.customerId]);
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id  WHERE games.id = $1`,[req.query.gameId]);
        
        getRentals(rentals,games,customers);
        res.send(rentals.rows)
    }
     else if(!!req.query.customerId) {
        const rentals = await connection.query(`SELECT * FROM rentals WHERE "customerId" = $1`,[req.query.customerId]);
        const customers = await connection.query("SELECT * FROM customers WHERE id = $1",[req.query.customerId]);
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id`);
        
        getRentals(rentals,games,customers);
        res.send(rentals.rows)

    } else if(!!req.query.gameId) {
        const rentals = await connection.query(`SELECT * FROM rentals WHERE "gameId" = $1`,[req.query.gameId]);
        const customers = await connection.query("SELECT * FROM customers");
        const games = await connection.query(`SELECT games.*, categories.name as "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE games.id = $1`,[req.query.gameId]);
        
        getRentals(rentals,games,customers);
        res.send(rentals.rows)
    } 
})

server.post('/rentals', async (req,res) => {
    const {error} = rentalSchema.validate(req.body);
    if(!error){
        const game = await connection.query("SELECT * FROM games WHERE id = $1",[req.body.gameId]);
        const customer = await connection.query("SELECT * FROM customers WHERE id = $1",[req.body.customerId]);
        
        if(game.rows.length > 0 && customer.rows.length > 0){
            const numberOsRentals = await connection.query(`SELECT * FROM rentals WHERE "gameId" = $1`,[req.body.gameId]);
            if(numberOsRentals.rows.length >= game.rows[0].stockTotal){
                res.sendStatus(400);
                return;
            }
            const newRental = {};
            const now = new Date();

            newRental.customerId = req.body.customerId;
            newRental.gameId = req.body.gameId;
            newRental.rentDate = now.toISOString().substring(0,10);
            newRental.daysRented = req.body.daysRented;
            newRental.returnDate = null;
            newRental.originalPrice = newRental.daysRented*game.rows[0].pricePerDay;
            newRental.delayFee = null;
            
            const {customerId,gameId,rentDate,daysRented,returnDate,originalPrice,delayFee} = newRental;
            const putRental = await connection.query(`INSERT INTO rentals("customerId","gameId","rentDate","daysRented","returnDate","originalPrice","delayFee") VALUES ($1,$2,$3,$4,$5,$6,$7)`,[customerId,gameId,rentDate,daysRented,returnDate,originalPrice,delayFee]);
            res.sendStatus(201);
            return;
        }
        res.sendStatus(400);
        return;
    } 

    res.sendStatus(400);
})

server.post('/rentals/:id/return', async (req,res) => {
    const now = new Date();
    const today = now.toISOString().substring(0,10);
    const existingId = await connection.query(`SELECT rentals.*, games."pricePerDay" FROM rentals JOIN games ON rentals."gameId" = games.id WHERE rentals.id = $1`,[req.params.id]);
    if(existingId.rows.length === 0){
        res.sendStatus(404);
        return;
    }
    if(!!existingId.rows[0].returnDate){
        res.sendStatus(400);
        return;
    }
    
    const delay = now.getDate() - existingId.rows[0].rentDate.getDate() - existingId.rows[0].daysRented;
    
    if (delay > 0){
        const newDate = new Date(delay*existingId.rows[0].pricePerDay);
        const returnedRental = await connection.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3`,[today, newDate, req.params.id]);
    } else {
        const newDate = new Date(0);
        const returnedRental = await connection.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3`,[today, newDate, req.params.id]);
    }

    res.sendStatus(200);
})

server.delete('/rentals/:id', async (req,res) => {
    const rental = await connection.query('SELECT * FROM rentals WHERE id = $1',[req.params.id]);
    if(rental.rows.length > 0){
        if(!rental.rows[0].returnDate){
            const deleteRental = await connection.query('DELETE FROM rentals WHERE id = $1',[req.params.id]);
            res.sendStatus(200);
            return;
        }
        res.sendStatus(400);
        return;
    }
    res.sendStatus(404);
})

server.listen(4000);