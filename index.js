




const{ 
    Engine, 
    Render, 
    Runner, 
    World, 
    Bodies,
    Body,
    Events
} = Matter;

const cellsHorizontal = Math.floor((Math.random()*30) + 20);
const cellsVertical = Math.floor((Math.random()*20) + 10);
// const levels = document.querySelector('#levels');
// levels.addEventListener('change', (e)=>{
//     if(e.target.value === 'easy'){
//         const cellsHorizontal = 20;
//         const cellsVertical = 10;
//     }
//     })
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width/cellsHorizontal;
const unitLengthY = height/cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const {world} = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);


//Walls
const walls = [
    Bodies.rectangle(width/2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width/2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height/2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height/2, 2, height, { isStatic: true }),
]
World.add(world, walls);

// Maze Generation

const shuffle = (arr) => {
    let count = arr.length;

    while(count > 0){
        const index = Math.floor(Math.random() * count);

        count--;

        const temp = arr[count];
        arr[count] = arr[index];
        arr[index] = temp;
    }

    return arr;
}

const grid = Array(cellsVertical)
.fill(null)
.map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
.fill(null)
.map(() => Array(cellsHorizontal-1).fill(false));

const horizontals = Array(cellsVertical-1)
.fill(null)
.map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random()*cellsVertical);
const startColumn = Math.floor(Math.random()*cellsHorizontal);

const gettingInsideCells = (row, column) => {
    // if i have visited the cell at [row, column], then return
    if(grid[row][column]) return;

    // Mark this cell as being visited
    grid[row][column] = true;

    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row-1, column, 'up'],
        [row, column+1, 'right'],
        [row+1, column, 'down'],
        [row, column-1, 'left']
    ]);

    // For each neighbor...

    for(let neighbor of neighbors){
        const [nextRow, nextColumn, dirction] = neighbor;

    // See if that neighbor is out of bound
        if(nextRow<0 || nextRow>=cellsVertical || nextColumn<0 || nextColumn>=cellsHorizontal){
        continue;
    }

    // if we have visited that neighbor, continue to the next neighbor
        if(grid[nextRow][nextColumn]){
            continue;
        }


    // Remove the wall from either horizontals or verticals
    if(dirction === 'left'){
        verticals[row][column-1] = true;
    } else if(dirction === 'right'){
        verticals[row][column] = true;
    } else if(dirction === 'up'){
        horizontals[row-1][column] = true;
    } else if(dirction === 'down'){
        horizontals[row][column] = true;
    }

    gettingInsideCells(nextRow, nextColumn);

    }
    // visit the next cell

};

gettingInsideCells(startRow, startColumn);
// console.log(startRow, startColumn)
// console.log(grid);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX/2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5, {
                label: 'wall',
                isStatic: true,
                render:{
                    fillStyle: '#FF865E'
                }
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex*unitLengthX + unitLengthX,
            rowIndex*unitLengthY + unitLengthY/2,
            5,
            unitLengthY,{
                label: 'wall',
                isStatic: true,
                render:{
                    fillStyle: '#FF865E'
                }
            }
        );
        World.add(world, wall);
    });
});

// Goal

const goal = Bodies.rectangle(
width - unitLengthX/2,
height - unitLengthY/2,
unitLengthX * .7,
unitLengthY * .7,{
    label: 'goal',
    isStatic: true,
    render: {
        fillStyle: '#A2D2FF'
    }
}
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX/4,unitLengthY/4);
const ball = Bodies.circle(unitLengthX/2, unitLengthY/2, ballRadius, {
    label: 'ball',
    render:{
        fillStyle: '#5FD068'
    }
})
World.add(world, ball);

document.addEventListener('keydown', e => {
    const {x, y} = ball.velocity;
    // console.log(x, y);
    const speedLimit = 10;

   if(e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' ){
    Body.setVelocity(ball, {x: x, y: Math.max(y-5, -speedLimit)}); 
   }

   if(e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight' ){
    Body.setVelocity(ball, {x: Math.min(x+5, speedLimit), y: y}); 
   }

   if(e.key === 's' || e.key === 'S' || e.key === 'ArrowDown' ){
    Body.setVelocity(ball, {x: x, y: Math.min(y+5, speedLimit)}); 
   }

   if(e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft' ){
    Body.setVelocity(ball, {x: Math.max(x-5, -speedLimit), y: y});
   }
});

// Win Condition 

Events.on(engine, 'collisionStart', e => {
e.pairs.forEach(collision => {
    const labels = ['ball', 'goal'];

    if(labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
        ){
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if(body.label==='wall'){
                    Body.setStatic(body, false);
                }
            })
        }
})
});