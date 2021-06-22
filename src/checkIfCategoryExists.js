export default function checkIfCategoryExists(game,categories){
    for(let i = 0; i < categories.length; i++){
        if(categories[i].id === game.categoryId){
            return true;
        }
    }
    return false;
}