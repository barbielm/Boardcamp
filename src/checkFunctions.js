export  function checkIfCategoryExists(game,categories){
    for(let i = 0; i < categories.length; i++){
        if(categories[i].id === game.categoryId){
            return true;
        }
    }
    return false;
}

export  function getRentals(rentals,games,customers){  
    rentals.rows.map( r => {
        for(let i = 0; i < customers.rows.length; i++){
            if(customers.rows[i].id === r.customerId){
                const {name, phone, cpf, birthday} = customers.rows[i];
                r.customer = {name, phone, cpf, birthday: birthday.toISOString().substring(0,10)};
            }
        }
        for(let i = 0; i < games.rows.length; i++){
            if(games.rows[i].id === r.gameId){
                r.game = games.rows[i];
            }
        }
        
        r.rentDate = r.rentDate.toISOString().substring(0,10);
        
        if(!!r.returnDate) r.returnDate = r.returnDate.toISOString().substring(0,10);
        
        if(!!r.delayFee) r.delayFee = r.delayFee.getMilliseconds() + 1000*r.delayFee.getSeconds();
    })

}

