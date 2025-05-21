const simulate_button = document.getElementById("simulate_button")
const speed_input = document.getElementById("speed_input");
const scale_input = document.getElementById("scale_input");
const visual_scale_input = document.getElementById("visual_scale_input");
const fps_input = document.getElementById("fps_input");
const pause_button = document.getElementById("pause_button");
const open_menu_button = document.getElementById("open_menu_button");
const close_menu_button = document.getElementById("close_menu_button");
const menu = document.getElementById("menu");
const add_body_button = document.getElementById("add_body_button");
const menu_container = document.getElementById("menu_container");
const screen_scale = document.getElementById("scale");
const time_scale = document.getElementById("time_scale");

let bodies = [];
const G = 6.67430e-11;

let scale = 1e6;
let scale_text;
let visual_scale = 1e2;

let fps = 60;
let speed = 1;
let now;
let then = performance.now();
let interval = 1000 / fps;
let timeDelta;
let dt = 86400 / fps;
let accumulator = 0;

let paused = false;
let bodies_dom;
let x_input_value, y_input_value, radius_input_value, mass_input_value, xvelocity_input_value, yvelocity_input_value, xaccel_input_value, yaccel_input_value, color_input_value;
let x_input, y_input, radius_input, mass_input, xvelocity_input, yvelocity_input, xaccel_input, yaccel_input, color_input;
let body_creator;
let delete_body_button;
let body_number = 1;

let following = null;
let dragging = false;
let last_drag_x, last_drag_y;

let screen_pos_x = 0
let screen_pos_y = 0;

class Body {
    constructor(body_name, x, y, radius, mass, color, xVelocity = 0, yVelocity = 0, xAcceleration = 0, yAcceleration = 0,) {
        this.body_name = body_name;
        this.x = x; // In KILOMETERS
        this.y = y;
        this.xVelocityHalf = xVelocity - xAcceleration * dt / 2;
        this.yVelocityHalf = yVelocity - yAcceleration * dt / 2;
        this.xAcceleration = xAcceleration;
        this.yAcceleration = yAcceleration;
        this.radius = radius;
        this.mass = mass;
        this.color = color;
        bodies.push(this);
    }
}

function bodiesDeclaration() {
    bodies_dom = document.getElementsByClassName("body");
    Array.from(bodies_dom).forEach(body => {
        let body_name = body.querySelector("h3").textContent;
        x_input_value = parseFloat(body.querySelector("#x_input").value);
        y_input_value = parseFloat(body.querySelector("#y_input").value);
        radius_input_value = parseFloat(body.querySelector("#radius_input").value);
        mass_input_value = parseFloat(body.querySelector("#mass_input").value);
        color_input_value = body.querySelector("#color_input").value;
        xvelocity_input_value = parseFloat(body.querySelector("#xvelocity_input").value);
        yvelocity_input_value = parseFloat(body.querySelector("#yvelocity_input").value);
        xaccel_input_value = parseFloat(body.querySelector("#xaccel_input").value);
        yaccel_input_value = parseFloat(body.querySelector("#yaccel_input").value);

        body_creator = new Body(
            body_name,
            x_input_value,
            y_input_value,
            radius_input_value,
            mass_input_value,
            color_input_value,
            xvelocity_input_value,
            yvelocity_input_value,
            xaccel_input_value,
            yaccel_input_value
        )

    });
}

function body_fusion(body_1, body_2) {
    let total_mass = body_1.mass + body_2.mass
    let body_1_volume = body_1.radius ** 3 * Math.PI * 4 / 3;
    let body_2_volume = body_2.radius ** 3 * Math.PI * 4 / 3;
    let total_volume = body_1_volume + body_2_volume;

    body_1.xVelocityHalf = (body_1.mass * body_1.xVelocityHalf + body_2.mass * body_2.xVelocityHalf) / total_mass;
    body_1.yVelocityHalf = (body_1.mass * body_1.yVelocityHalf + body_2.mass * body_2.yVelocityHalf) / total_mass;

    body_1.x = (body_1.x * body_1.mass + body_2.x * body_2.mass) / total_mass;
    body_1.y = (body_1.y * body_1.mass + body_2.y * body_2.mass) / total_mass;

    body_1.mass = total_mass;
    body_1.radius = (total_volume * 3 / 4 / Math.PI) ** (1 / 3);
    bodies = bodies.filter(b => b !== body_2);
}

function check_colission(body_1, body_2, distance) {
    if (distance <= body_1.radius + body_2.radius) {
        if (body_1.mass > body_2.mass) {
            body_fusion(body_1, body_2);
        } else {
            body_fusion(body_2, body_1);
        }
    }
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

            body2 = bodies[j];

            deltaX = body2.x - body.x;
            deltaY = body2.y - body.y;
            hipotenuse = Math.sqrt(deltaX ** 2 + deltaY ** 2);
            cosine = deltaX / hipotenuse;
            sine = deltaY / hipotenuse;
            acceleration = G * body2.mass / (hipotenuse ** 2);
            xAcceleration = cosine * acceleration;
            yAcceleration = sine * acceleration;
            body.xAcceleration += xAcceleration;
            body.yAcceleration += yAcceleration;
            check_colission(body, body2, hipotenuse);
        }
    }


    for (let i = 0; i < bodies.length; i++) {
        body = bodies[i];
        body.xVelocityHalf += body.xAcceleration * dt;
        body.yVelocityHalf += body.yAcceleration * dt;
        body.x += body.xVelocityHalf * dt;
        body.y += body.yVelocityHalf * dt;
    }
}

function draw(ctx, canvas) {
    let body;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let point_0_x = window.innerWidth / 2;
    let point_0_y = window.innerHeight / 2;
    if (following) {
        point_0_x += -following.x / scale;
        point_0_y += following.y / scale;
        console.log(following);
        screen_pos_x = 0;
        screen_pos_y = 0;
    }
    for (let i = 0; i < bodies.length; i++) {
        ctx.beginPath();
        body = bodies[i];
        ctx.fillStyle = body.color;
        ctx.arc(((body.x / scale) + point_0_x + screen_pos_x), (-(body.y / scale) + point_0_y + screen_pos_y), body.radius / scale * visual_scale, 0, Math.PI * 2);
        ctx.fill();
    }
}


function animate(ctx, canvas) {
    requestAnimationFrame(() => animate(ctx, canvas));

    if (!paused) {
        now = performance.now();
        let delta = (now - then) / 1000;  // convert ms to seconds
        then = now;

        accumulator += delta * speed;  // speed scales simulation time

        while (accumulator >= dt) {
            update();
            accumulator -= dt;
        }
    }
    draw(ctx, canvas);
}

function update_scale(scale) {
    scale_text = (200 * scale);
    if (scale_text > 10000) {
        scale_text = scale_text.toExponential(1);
    } else {
        scale_text = Math.round(scale_text);
    }
    screen_scale.textContent = scale_text + " km";
}

simulate_button.addEventListener("click", (() => {
    bodies = [];

    speed = speed_input.value;
    dt = speed / fps;
    scale = scale_input.value;
    visual_scale = visual_scale_input.value;
    fps = fps_input.value;

    update_scale(scale);
    time_scale.textContent = parseFloat(speed).toExponential() + " days/second";
    bodiesDeclaration();
}))

window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        simulate_button.click();
    }
});

window.addEventListener("wheel", (event) => {
    if (event.target == canvas) {
        const zoomIntensity = 0.001;
        const zoom = Math.exp(event.deltaY * zoomIntensity);
        scale *= zoom;
        update_scale(scale);
    }
})

window.addEventListener("mouseup", () => {
    dragging = false;
    last_drag_x = null;
    last_drag_y = null;
    canvas.classList.add("cursor-grab");
    canvas.classList.remove("cursor-grabbing");
})

window.addEventListener("mousemove", (event) => {
    if (dragging) {
        let drag_x = event.offsetX;
        let drag_y = event.offsetY;
        if (last_drag_x) {
            screen_pos_x += drag_x - last_drag_x;
            screen_pos_y += drag_y - last_drag_y;
            console.log(screen_pos_x, screen_pos_y);
        }
        last_drag_x = drag_x;
        last_drag_y = drag_y;
    }
})

canvas.addEventListener("mousedown", () => {
    dragging = true;
    canvas.classList.remove("cursor-grab");
    canvas.classList.add("cursor-grabbing");
})


pause_button.addEventListener("click", (() => {
    if (pause_button.textContent === "▶") {
        pause_button.textContent = "| |";
        paused = false;
    } else {
        pause_button.textContent = "▶";
        paused = true;
    }
}))

open_menu_button.addEventListener("click", (() => {
    menu.style.display = "flex";
    open_menu_button.style.display = "none";
    menu_container.classList.add("overflow-y-auto");
}))

close_menu_button.addEventListener("click", (() => {
    menu.style.display = "none";
    open_menu_button.style.display = "flex";
    menu_container.classList.remove("overflow-y-auto");
}))

add_body_button.addEventListener("click", (() => {
    // Variables with default values
    let color_input = "#f6b73c";
    let x_input = 0;
    let y_input = 0;
    let radius_input = 80000;
    let mass_input = 6e30;
    let xvelocity_input = 0;
    let yvelocity_input = 0;
    let xaccel_input = 0;
    let yaccel_input = 0;

    // Create container div to hold everything
    const container = document.createElement("div");
    container.classList.add("border-b-2");
    container.classList.add("border-white");
    container.classList.add("p-2");
    container.classList.add("w-full");
    container.classList.add("flex");
    container.classList.add("flex-col");
    container.classList.add("body");

    // Helper function to create input rows
    function createRow(labelText, inputType, inputId, inputValue, extraClasses = "") {
        const row = document.createElement("div");
        row.className = "flex w-full justify-between";

        const label = document.createElement("div");
        label.textContent = labelText;
        row.appendChild(label);

        const input = document.createElement("input");
        input.type = inputType;
        input.id = inputId;
        input.name = inputId;
        input.value = inputValue;
        input.className = "bg-black border-white border-[1px] text-center " + extraClasses;

        row.appendChild(input);
        return row;
    }

    // First row with color picker and heading
    const firstRow = document.createElement("div");
    firstRow.className = "flex justify-between";

    const heading = document.createElement("h3");
    heading.className = "text-md sm:text-lg md:text-xl";
    body_number += 1;
    heading.textContent = "Body-" + body_number;

    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.id = "color_input";
    colorPicker.classList.add("w-1/3")
    colorPicker.value = color_input;

    delete_body_button = document.createElement("button");
    delete_body_button.textContent = "X";
    delete_body_button.classList.add("text-lg");
    delete_body_button.classList.add("sm:text-xl");
    delete_body_button.classList.add("md:text-3xl");
    delete_body_button.classList.add("delete_body_button");

    delete_body_button = document.createElement("button");
    delete_body_button.textContent = "╰┈➤";
    delete_body_button.classList.add("follow_button");

    firstRow.appendChild(heading);
    firstRow.appendChild(colorPicker);
    firstRow.appendChild(delete_body_button)

    // Append first row to container
    container.appendChild(firstRow);

    // Append all other rows with labels and inputs
    container.appendChild(createRow("X pos:", "number", "x_input", x_input));
    container.appendChild(createRow("Y pos:", "number", "y_input", y_input));
    container.appendChild(createRow("Radius:", "number", "radius_input", radius_input));
    container.appendChild(createRow("Mass:", "number", "mass_input", mass_input));
    container.appendChild(createRow("Init X Velocity:", "number", "xvelocity_input", xvelocity_input));
    container.appendChild(createRow("Init Y Velocity:", "number", "yvelocity_input", yvelocity_input));
    container.appendChild(createRow("Init X Accel:", "number", "xaccel_input", xaccel_input));
    container.appendChild(createRow("Init Y Accel:", "number", "yaccel_input", yaccel_input));

    // Append container to body or any other element in your page
    add_body_button.parentNode.insertBefore(container, add_body_button);
}))

function delete_body(button) {
    button.parentNode.parentNode.remove()
}

function follow_body(button) {
    let body_name = button.parentNode.querySelector("h3").textContent;
    following = bodies.find((body) => body.body_name == body_name);
}

menu.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete_body_button")) {
        delete_body(e.target);
    } else if (e.target.classList.contains("follow_button")) {
        follow_body(e.target);
    }
});

function main() {
    const canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d");

    simulate_button.click()
    animate(ctx, canvas)
}

main();
