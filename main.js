const simulate_button = document.getElementById("simulate_button")
const speed_input = document.getElementById("speed_input");
const scale_input = document.getElementById("scale_input");
const visual_scale_input = document.getElementById("visual_scale_input");
const fps_input = document.getElementById("fps_input");
const pause_button = document.getElementById("pause_button");

let bodies = [];
const G = 6.67430e-11;

let scale = 1e-6;
let visual_scale = 1e2;

let fps = 60;
let speed = 1;
let now;
let then = performance.now();
let interval = 1000 / fps;
let timeDelta;

let paused = false;

class Body {
    constructor(x, y, radius, mass, color, xVelocity = 0, yVelocity = 0, xAcceleration = 0, yAcceleration = 0,) {
        this.x = x * window.innerWidth / 100 / scale;
        this.y = y * window.innerHeight / 100 / scale;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
        this.xAcceleration = xAcceleration;
        this.yAcceleration = yAcceleration;
        this.radius = radius * scale * visual_scale;
        this.mass = mass;
        this.color = color;
        bodies.push(this);
    }
}

function bodiesDeclaration() {
    const yellowPlanet = new Body(50, 50, 80000, 6e30, "yellow", 0, 0);
    const bluePlanet = new Body(30, 80, 30000, 6e25, "blue", 5e5, 3e5);
    const whitePlanet = new Body(32, 85, 30000, 6e25, "white", 7e5, -1.3e6);
}

function update() {
    let body, body2, deltaX, deltaY, hipotenuse, cosine, sine, acceleration, xAcceleration, yAcceleration;
    for (let i = 0; i < bodies.length; i++) {
        body = bodies[i];
        body.xAcceleration = 0;
        body.yAcceleration = 0;

        for (let j = 0; j < bodies.length; j++) {
            if (i == j) {
                continue;
            }

            body2 = bodies[j]

            deltaX = body2.x - body.x;
            deltaY = body2.y - body.y;
            hipotenuse = Math.sqrt(deltaX ** 2 + deltaY ** 2);
            if (hipotenuse < 1e-6) {
                hipotenuse = 1e-1;
            }
            cosine = deltaX / hipotenuse;
            sine = deltaY / hipotenuse;
            acceleration = G * body2.mass / (hipotenuse ** 2);
            xAcceleration = cosine * acceleration;
            yAcceleration = sine * acceleration;
            body.xAcceleration += xAcceleration;
            body.yAcceleration += yAcceleration;
        }
    }


    for (let i = 0; i < bodies.length; i++) {
        body = bodies[i];
        body.xVelocity += body.xAcceleration;
        body.yVelocity += body.yAcceleration;
        body.x += body.xVelocity;
        body.y += body.yVelocity;
    }
}

function draw(ctx, canvas) {
    let body;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bodies.length; i++) {
        ctx.beginPath();
        body = bodies[i];
        ctx.fillStyle = body.color;
        ctx.arc(body.x * scale, body.y * scale, body.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}


function animate(ctx, canvas) {
    requestAnimationFrame(() => animate(ctx, canvas));
    if (!paused) {
        now = performance.now();
        let delta = now - then;

        if (delta > interval) {
            then = now - (delta % interval);

            for (i = 0; i <= speed; i++) {
                update();
            }
            draw(ctx, canvas);
        }
    }
}

function main() {
    const canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d");

    bodiesDeclaration();
    animate(ctx, canvas);
    console.log(bodies);
}

main();

simulate_button.addEventListener("click", (() => {
    bodies = [];

    speed = speed_input.value;
    scale = scale_input.value;
    visual_scale = visual_scale_input.value;
    fps = fps_input.value;

    bodiesDeclaration();
}))

window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        simulate_button.click();
    }
});

pause_button.addEventListener("click", (() => {
    if (pause_button.textContent === "▶") {
        pause_button.textContent = "| |";
        paused = false;
    } else {
        pause_button.textContent = "▶";
        paused = true;
    }
}))