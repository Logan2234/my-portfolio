
const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

const particle_array = [];
const NB_PARTICLES = Math.round(window.innerWidth * window.innerHeight / 10000);
const DIST_LINK = 90;

let color_mode = 0; // 0 = colorless, 1 = colorful
let gravity_mode = 0; // 0 = normal, 1 = gravity
let help_displayed = false;

function distance(ax, ay, bx, by) {
    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
}

class Particle {
    #x;
    #y;
    #vx;
    #vy;
    #angle;
    #color;
    #mode; // 0 = normal, 1 = attractive, -1 = repulsive

    constructor(x, y) {
        this.#x = x;
        this.#y = y;
        this.#angle = Math.random() * Math.PI * 2;
        this.#vx = Math.cos(this.#angle);
        this.#vy = Math.sin(this.#angle);
        if (color_mode) {
            // eslint-disable-next-line no-undef
            this.#color = randomColor();
            this.#mode = 0;
        }
        else if (gravity_mode) {
            if (Math.random() <= 0.5) {
                this.modeRepulsive();
            }
            else {
                this.modeAttractive();
            }
        }
        else {
            this.#color = "rgb(150,150,150)";
            this.#mode = 0;
        }
    }

    getX() {
        return this.#x;
    }

    getY() {
        return this.#y;
    }

    getColor() {
        return this.#color;
    }

    setColor(new_color) {
        this.#color = new_color;
    }

    getMode() {
        return this.#mode;
    }

    resetMode() {
        this.#mode = 0;
        this.#color = "rgb(150,150,150)";
        this.#vx = Math.cos(this.#angle);
        this.#vy = Math.sin(this.#angle);
    }

    modeRepulsive() {
        this.#mode = -1;
        this.#color = "rgb(255, 80, 150)";
    }

    modeAttractive() {
        this.#mode = 1;
        this.#color = "rgb(80, 150, 255)";
    }

    draw() {
        ctx.fillStyle = this.#color;

        ctx.beginPath();
        ctx.arc(this.#x, this.#y, 2, 0, Math.PI * 2);
        ctx.fill();
        let curr_part = this;
        particle_array.forEach(function (elt) {
            let dist = distance(curr_part.getX(), curr_part.getY(), elt.getX(), elt.getY());
            if (curr_part != elt && dist <= DIST_LINK) {
                ctx.moveTo(curr_part.#x, curr_part.#y);
                ctx.lineTo(elt.getX(), elt.getY());
                let transparence = 1 - dist / DIST_LINK;
                if (color_mode) {
                    let rgb_curr = curr_part.getColor().replace("rgb(", "").replace(")", "").split(", ");
                    let rgb_elt = elt.getColor().replace("rgb(", "").replace(")", "").split(", ");
                    let res = [];
                    for (let i = 0; i < 3; i++) {
                        res.push((parseInt(rgb_curr[i]) + parseInt(rgb_elt[i])) / 2);
                    }
                    ctx.strokeStyle = `rgba(${res[0]},${res[1]},${res[2]},${transparence})`;
                }
                else {
                    ctx.strokeStyle = "rgba(100,100,100," + transparence + ")";
                }
                ctx.stroke();
            }
        });
    }

    move() {
        this.#x += this.#vx;
        this.#y += this.#vy;
        if (this.#x < 0 || this.#x > canvas.width) {
            this.#vx = -this.#vx;
        }
        else if (this.#y < 0 || this.#y >= canvas.height) {
            this.#vy = -this.#vy;
        }
    }

    computeGravity() {
        for (let elt of particle_array) {
            if (elt != this) {
                let dist = distance(this.#x, this.#y, elt.getX(), elt.getY());
                if (dist <= DIST_LINK) {
                    let force = this.#mode * elt.getMode() / dist;
                    let angle = Math.atan((this.#y - elt.getY()) / (this.#x - elt.getX()));
                    if ((this.#y - elt.getY() <= 0 && this.#x - elt.getX() <= 0) || (this.#y - elt.getY() >= 0 && this.#x - elt.getX() <= 0)) {
                        this.#vx -= force * Math.cos(angle);
                        this.#vy -= force * Math.sin(angle);
                    }
                    else {
                        this.#vx += force * Math.cos(angle);
                        this.#vy += force * Math.sin(angle);
                    }
                }
            }
        }
    }
}

function init() {
    resize();
    // Particles gen
    for (let i = 0; i < NB_PARTICLES; i++) {
        particle_array.push(new Particle(Math.random() * document.documentElement.clientWidth, Math.random() * document.documentElement.clientHeight));
    }
    move();
}

function resize() {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
}

function move() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let elt of particle_array) {
        if (gravity_mode) {
            elt.computeGravity();
        }
        elt.move();
        elt.draw();
    }
    setTimeout(move, 20);
}

function mouse_move() {
    let pos_x = window.event.clientX;
    let pos_y = window.event.clientY;
    for (let elt of particle_array) {
        let dist = distance(pos_x, pos_y, elt.getX(), elt.getY());
        if (dist <= DIST_LINK * 4 / 3) {
            ctx.moveTo(pos_x, pos_y);
            ctx.lineTo(elt.getX(), elt.getY());
            let transparence = 1 - dist / (DIST_LINK * 4 / 3);
            ctx.strokeStyle = "rgba(150,150,150," + transparence + ")";
            ctx.stroke();
        }
    }
}

function mouse_click() {
    let pos_x = window.event.clientX;
    let pos_y = window.event.clientY;
    particle_array.push(new Particle(pos_x, pos_y));
}

function toggleColor() {
    if (color_mode) {
        for (let elt of particle_array) {
            elt.setColor("rgb(150, 150, 150)");
        }
        color_mode = 0;
    }
    else {
        for (let elt of particle_array) {
            if (gravity_mode) {
                elt.resetMode();
            }
            // eslint-disable-next-line no-undef
            elt.setColor(randomColor({ format: "rgb" }));
        }
        gravity_mode = 0;
        color_mode = 1;
    }
}

function toggleGravity() {
    if (gravity_mode) {
        for (let elt of particle_array) {
            elt.resetMode();
        }
        gravity_mode = 0;
    }
    else {
        for (let elt of particle_array) {
            if (Math.random() <= 0.5) {
                elt.modeRepulsive();
            }
            else {
                elt.modeAttractive();
            }
        }
        color_mode = 0;
        gravity_mode = 1;
    }
}

function keyHandler() {
    let key_pressed = window.event.keyCode;
    let shift_pressed = window.event.shiftKey;
    if (shift_pressed) {
        // console.log(key_pressed);
        if (key_pressed == 13) {
            toggleColor();
        }
        else if (key_pressed == 32) {
            toggleGravity();
        }
        else if (key_pressed == 43) {
            particle_array.push(new Particle(Math.random() * document.documentElement.clientWidth, Math.random() * document.documentElement.clientHeight));
        }
        else if (key_pressed == 45) {
            particle_array.pop();
        }
        else if (key_pressed == 63) {
            if (help_displayed) {
                setTimeout(() => {document.getElementById("help").style.display = "none";}, 400);
                document.getElementById("help_content").className = "help_hidden";
            }
            else {
                document.getElementById("help").style.display = "flex";
                document.getElementById("help_content").className = "help_shown";
            }
            help_displayed = !help_displayed;
        }
    }
}

window.addEventListener("load", init, false);
window.addEventListener("resize", resize, false);
window.addEventListener("mousemove", mouse_move, false);
window.addEventListener("click", mouse_click, false);
window.addEventListener("keypress", keyHandler, false);
