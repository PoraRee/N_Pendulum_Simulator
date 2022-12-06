// global parameters

var numSubsteps = 50;
var numPoints = 4;
var defaultRadius = 0.3;
var defaultMass = 1.0;
var gravity = 10;
var dt = 1 / 60;
var edgeDampingCoeff = 0;
var globalDampingCoeff = 0;

//Circle parameters
var circlePosX = 0;
var circlePosY = 0;
var circleInvMass = 1;
var circleSize = 1;
var isFloat = false;

var conserveEnergy = false;
var collisionHandling = false;
var showTrail = true;
var showForces = false;
var maxPoints = 5;

var maxTrailLen = 1000;
var trailDist = 0.01;

var mouseCompliance = 0.001;
var mouseDampingCoeff = 100.0;

var canvas = document.getElementById("myCanvas");
var c = canvas.getContext("2d");
var canvasOrig = { x: canvas.width / 2, y: canvas.height / 4 };
var simWidth = 2.0;
var pointSize = 10;
var drawScale = canvas.width / simWidth;

var i, j;

// GUI callbacks
document.getElementById("stepsSlider").oninput = function () {
  var steps = [1, 5, 10, 20, 50, 100, 1000];
  numSubsteps = steps[Number(this.value)];
  document.getElementById("steps").innerHTML = numSubsteps.toString();
};
document.getElementById("segsSlider").oninput = function () {
  numPoints = Number(this.value) + 1;
  document.getElementById("numSegs").innerHTML = this.value;
  resetPos(false);
};

document.getElementById("edgeDampingSlider").oninput = function () {
  var coeffs = ["0.0", "10.0", "100.0"];
  var coeff = coeffs[Number(this.value)];
  edgeDampingCoeff = Number(coeff);
  document.getElementById("edgeDamping").innerHTML = coeff;
};

document.getElementById("globalDampingSlider").oninput = function () {
  var coeffs = ["0.0", "0.5", "1.0", "2.0"];
  var coeff = coeffs[Number(this.value)];
  globalDampingCoeff = Number(coeff);
  document.getElementById("globalDamping").innerHTML = coeff;
};

function setupMass(value, output, pointNr) {
  var masses = ["0.001", "0.5", "1.0", "2.0", "10"];
  var m = masses[value];
  document.getElementById(output).innerHTML = m;
  points[pointNr].invMass = 1.0 / Number(m);
  points[pointNr].size = Math.sqrt(Number(m));
}

function setupRadius(value, output, pointNr) {
  var lengths = ["0.2", "0.3", "0.4"];
  var len = lengths[value];
  document.getElementById(output).innerHTML = len;
  points[pointNr].radius = Number(len);
  resetPos(false);
}

function setupCompliance(value, output, pointNr) {
  var values = ["0.000", "0.001", "0.010"];
  var compliance = values[value];
  document.getElementById(output).innerHTML = compliance;
  points[pointNr].compliance = Number(compliance);
}

document.getElementById("mass1Slider").oninput = function () {
  setupMass(Number(this.value), "mass1", 1);
};
document.getElementById("mass2Slider").oninput = function () {
  setupMass(Number(this.value), "mass2", 2);
};
document.getElementById("mass3Slider").oninput = function () {
  setupMass(Number(this.value), "mass3", 3);
};
document.getElementById("mass4Slider").oninput = function () {
  setupMass(Number(this.value), "mass4", 4);
};
document.getElementById("radius1Slider").oninput = function () {
  setupRadius(Number(this.value), "radius1", 1);
};
document.getElementById("radius2Slider").oninput = function () {
  setupRadius(Number(this.value), "radius2", 2);
};
document.getElementById("radius3Slider").oninput = function () {
  setupRadius(Number(this.value), "radius3", 3);
};
document.getElementById("radius4Slider").oninput = function () {
  setupRadius(Number(this.value), "radius4", 4);
};
document.getElementById("compliance1Slider").oninput = function () {
  setupCompliance(Number(this.value), "compliance1", 1);
};
document.getElementById("compliance2Slider").oninput = function () {
  setupCompliance(Number(this.value), "compliance2", 2);
};
document.getElementById("compliance3Slider").oninput = function () {
  setupCompliance(Number(this.value), "compliance3", 3);
};
document.getElementById("compliance4Slider").oninput = function () {
  setupCompliance(Number(this.value), "compliance4", 4);
};

//TODO
//Add floating circle
function onFloat() {
  isFloat = !isFloat;
  // console.log(isFloat);
}
function onEnergy() {
  conserveEnergy = !conserveEnergy;
  resetPos(false);
}

function onCollision() {
  collisionHandling = !collisionHandling;
  resetPos(false);
}

function onTrail() {
  showTrail = !showTrail;
  trail = [];
  trailLast = 0;
}

function onForces() {
  showForces = !showForces;
}

function onUnilateral(nr) {
  points[nr].unilateral = !points[nr].unilateral;
}

//TODO
//Circle
function updateCirclePos() {
  circleX = document.getElementById("circleX").innerHTML;
  circleY = document.getElementById("circleY").innerHTML;
  circleSize = Math.sqrt(1 / Number(circleInvMass));
  // console.log(circleX, circleY, circleInvMass, circleSize);
}
updateCirclePos();
var circlePositionXSteps = ["-1.0", "-0.5", "0.0", "0.5", "1.0"];
var circlePositionYSteps = ["-1.5", "-1.0", "-0.5", "0.0", "0.5"];
document.getElementById("circleXSlider").oninput = function () {
  var posX = circlePositionXSteps[Number(this.value)];
  circlePosX = Number(posX);
  document.getElementById("circleX").innerHTML = circlePosX;
  updateCirclePos();
};
document.getElementById("circleYSlider").oninput = function () {
  var posY = circlePositionYSteps[Number(this.value)];
  circlePosY = Number(posY);
  document.getElementById("circleY").innerHTML = circlePosY;
  updateCirclePos();
};
function setupObjMass(value, output) {
  var masses = ["0.1", "0.5", "1.0", "2.0", "10"];
  var m = masses[value];
  document.getElementById(output).innerHTML = Number(m);
  circleInvMass = 1.0 / Number(m);
  updateCirclePos();
}
document.getElementById("circleMassSlider").oninput = function () {
  setupObjMass(Number(this.value), "circleMass", 1);
};
function createCircle() {
  collisionObjects.push({
    invMass: circleInvMass,
    size: circleSize,
    pos: new Vector(circlePosX, circlePosY),
    prev: new Vector(circlePosX, circlePosY),
    radius: 0.3,
    vel: new Vector(0, 0),
    compliance: 0,
    unilateral: false,
    force: 0,
    elongation: 0,
  });
  numObjects++;
  // console.log(collisionObjects);
}

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  copy(v) {
    return new Vector(this.x, this.y);
  }
  assign(v) {
    this.x = v.x;
    this.y = v.y;
  }
  plus(v) {
    return new Vector(this.x + v.x, this.y + v.y);
  }
  minus(v) {
    return new Vector(this.x - v.x, this.y - v.y);
  }
  add(v, s = 1) {
    this.x += v.x * s;
    this.y += v.y * s;
  }
  scale(s) {
    this.x *= s;
    this.y *= s;
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  normalize() {
    var d = Math.sqrt(this.x * this.x + this.y * this.y);
    if (d > 0) {
      this.x /= d;
      this.y /= d;
    } else this.x = 1;
    return d;
  }
  lenSquared() {
    return this.x * this.x + this.y * this.y;
  }
  distSquared(v) {
    return (this.x - v.x) * (this.x - v.x) + (this.y - v.y) * (this.y - v.y);
  }
}

// trail

var trailLast = 0;
var trail = [];

function trailAdd(p) {
  if (trail.length == 0) trail.push(p.copy());
  else {
    var d2 = trail[trailLast].distSquared(p);
    if (d2 > trailDist * trailDist) {
      trailLast = (trailLast + 1) % maxTrailLen;
      if (trail.length < maxTrailLen) trail.push(p.copy());
      else trail[trailLast].assign(p);
    }
  }
}

// Configure circles
// List of circles
var collisionObjects = [];
var numObjects = 0;
var defaultY = -1;
var maxCollisionObjects = 1;
// for (i = 1; i <= maxCollisionObjects; i++) {
//   collisionObjects.push({
//     invMass: i == 0 ? 0 : 1 / defaultMass,
//     radius: i == 0 ? 0 : defaultRadius,
//     // size: Math.sqrt(1.0 * defaultMass * 5),
//     size: 1,
//     pos: new Vector(-0.25, defaultY + 0.15),
//     prev: new Vector(),
//     vel: new Vector(),
//     compliance: 0,
//     unilateral: false,
//     force: 0,
//     elongation: 0,
//   });
// }

// pendulum definition

var points = [];
for (i = 0; i < maxPoints; i++)
  points.push({
    invMass: i == 0 ? 0 : 1 / defaultMass,
    radius: i == 0 ? 0 : defaultRadius,
    size: 0,
    pos: new Vector(),
    prev: new Vector(),
    vel: new Vector(),
    compliance: 0,
    unilateral: false,
    force: 0,
    elongation: 0,
  });

function resetPos(equilibrium) {
  var pos = equilibrium
    ? new Vector(0, 0)
    : new Vector(points[1].radius, -points[1].radius);

  for (i = 1; i < points.length; i++) {
    p = points[i];
    p.size = Math.sqrt(1.0 / p.invMass);
    pos.y = equilibrium ? pos.y - p.radius : pos.y + p.radius;
    p.pos.assign(pos);
    p.prev.assign(pos);
    p.vel.x = 0;
    p.vel.y = 0;
  }
  trail = [];
  trailLast = 0;
  draw();
}

// draw pendulum

function draw() {
  c.clearRect(0, 0, canvas.width, canvas.height);

  c.lineWidth = 3;
  c.font = "15px Arial";

  var x = canvasOrig.x;
  var y = canvasOrig.y;

  // console.log("start draw")
  for (i = 1; i < numPoints; i++) {
    var avgX = x,
      avgY = y;
    p = points[i];
    // console.log(p.pos.x, p.pos.y)
    if (p.compliance > 0) c.strokeStyle = "#0000FF";
    else if (p.unilateral) c.strokeStyle = "#00FF00";
    else c.strokeStyle = "#000000";
    c.beginPath();
    c.moveTo(x, y);
    x = canvasOrig.x + p.pos.x * drawScale;
    y = canvasOrig.y - p.pos.y * drawScale;
    c.lineTo(x, y);
    c.stroke();
    avgX = (avgX + x) / 2;
    avgY = (avgY + y) / 2;

    // To create text
    if (showForces)
      c.fillText(
        "  f=" + p.force.toFixed(0) + "N, dx=" + p.elongation.toFixed(4) + "m",
        avgX,
        avgY
      );
  }

  c.lineWidth = 1;

  if (grabPointNr > 0) {
    c.strokeStyle = "#FF8000";
    c.beginPath();
    c.moveTo(
      canvasOrig.x + grabPoint.pos.x * drawScale,
      canvasOrig.y - grabPoint.pos.y * drawScale
    );
    c.lineTo(
      canvasOrig.x + points[grabPointNr].pos.x * drawScale,
      canvasOrig.y - points[grabPointNr].pos.y * drawScale
    );
    c.stroke();
  }

  for (i = 1; i < numPoints; i++) {
    p = points[i];
    x = canvasOrig.x + p.pos.x * drawScale;
    y = canvasOrig.y - p.pos.y * drawScale;
    c.beginPath();
    c.arc(x, y, pointSize * p.size, 0, Math.PI * 2, true);
    // console.log("Point", i)
    // console.log(x,y,pointSize* p.size)
    c.closePath();
    c.fill();
  }

  // collision objects are added here
  for (i = 0; i < numObjects; i++) {
    p = collisionObjects[i];
    x = canvasOrig.x + p.pos.x * drawScale;
    y = canvasOrig.y - p.pos.y * drawScale;
    // console.log(x,y,pointSize* p.size)
    c.beginPath();
    c.arc(x, y, pointSize * p.size, 0, Math.PI * 2, true);
    c.closePath();
    c.fill();
  }

  if (trail.length > 1) {
    c.strokeStyle = "#FF0000";
    c.beginPath();
    var pos = (trailLast + 1) % trail.length;
    c.moveTo(
      canvasOrig.x + trail[pos].x * drawScale,
      canvasOrig.y - trail[pos].y * drawScale
    );
    for (i = 0; i < trail.length - 1; i++) {
      pos = (pos + 1) % trail.length;
      c.lineTo(
        canvasOrig.x + trail[pos].x * drawScale,
        canvasOrig.y - trail[pos].y * drawScale
      );
    }
    c.stroke();
    c.strokeStyle = "#000000";
  }
}

// simulation (replace with yours) ------------------------------------------------------------

function solveDistPos(p0, p1, d0, compliance, unilateral, dt) {
  var w = p0.invMass + p1.invMass;
  if (w == 0) return;
  var grad = p1.pos.minus(p0.pos);
  var d = grad.normalize();
  w += compliance / dt / dt;
  var lambda = (d - d0) / w;

  if (lambda < 0 && unilateral) return;
  p1.force = lambda / dt / dt;
  p1.elongation = d - d0;
  p0.pos.add(grad, p0.invMass * lambda);
  p1.pos.add(grad, -p1.invMass * lambda);
}

function solveDistVel(p0, p1, dampingCoeff, dt) {
  var n = p1.pos.minus(p0.pos);
  n.normalize();
  var v0 = n.dot(p0.vel);
  var v1 = n.dot(p1.vel);
  var dv0 = (v1 - v0) * Math.min(0.5, dampingCoeff * dt * p0.invMass);
  var dv1 = (v0 - v1) * Math.min(0.5, dampingCoeff * dt * p1.invMass);
  p0.vel.add(n, dv0);
  p1.vel.add(n, dv1);
}

function solvePointVel(p, dampingCoeff, dt) {
  var n = p.vel.copy();
  var v = n.normalize();
  var dv = -v * Math.min(1.0, dampingCoeff * dt * p.invMass);
  p.vel.add(n, dv);
}

// TODO
// O(N*M) where N = #pendulum, M = #objects

function euclidean(p, o) {
  p_x = canvasOrig.x + p.pos.x * drawScale;
  p_y = canvasOrig.y - p.pos.y * drawScale;
  o_x = canvasOrig.x + o.pos.x * drawScale;
  o_y = canvasOrig.y - o.pos.y * drawScale;
  return Math.sqrt((p_x - o_x) * (p_x - o_x) + (p_y - o_y) * (p_y - o_y));
}

function collide(p, o, type = "circle") {
  if (type == "circle") {
    // radius of p
    p_radius = pointSize * p.size;
    // object radius
    o_radius = pointSize * o.size;
    bound_dist = p_radius + o_radius;
    p_x = canvasOrig.x + p.pos.x * drawScale;
    p_y = canvasOrig.y - p.pos.y * drawScale;
    o_x = canvasOrig.x + o.pos.x * drawScale;
    o_y = canvasOrig.y - o.pos.y * drawScale;
    euclidean_dist = Math.sqrt(
      (p_x - o_x) * (p_x - o_x) + (p_y - o_y) * (p_y - o_y)
    );
    // euclidean_dist = euclidean(p,o)
    // console.log(p_x,p_y, o_x,o_y, bound_dist, euclidean_dist)
    if (euclidean_dist < bound_dist) {
      return 1;
    } else return 0;
  }
}

function solvePosCollide(p0, p1, d0, change = 3, alpha = 0.002) {
  var w = p0.invMass + p1.invMass;
  var ratio0 = p0.invMass / w;
  var ratio1 = p1.invMass / w;
  var euc = euclidean(p0, p1);
  var d = d0;
  var n = p1.pos.minus(p0.pos);
  n.normalize();
  // console.log(p0.pos);
  // bitwise
  if ((change & 1) != 0) {
    p0.pos.add(n, ratio0 * (euc - d) * alpha);
  }
  if ((change & 2) != 0) {
    p1.pos.add(n, (-ratio1 * (euc - d) * alpha) / 4);
  }
  // console.log(p0.pos);
}

function boundCollide(obj) {
  o_radius = pointSize * obj.size;
  var px = canvasOrig.x + obj.pos.x * drawScale;
  var py = canvasOrig.y - obj.pos.y * drawScale;
  var R = px + o_radius;
  var D = py + o_radius;
  var U = py - o_radius;
  var L = px - o_radius;
  if (D >= 500 || U <= 0 || R >= 500 || L <= 0) {
    // console.log("COLLIDE")
    // console.log(D,U,R,L);
    return 1;
  }
}

// TASK: change the way we handle this
var ptmp = {
  invMass: i == 0 ? 0 : 1 / defaultMass,
  radius: i == 0 ? 0 : defaultRadius,
  size: Math.sqrt(1.0 * defaultMass * 5),
  pos: new Vector(-0.25, -1.5 - 0.085),
  // pos: new Vector(-0.25, defaultY + 0.15),
  prev: new Vector(),
  vel: new Vector(),
  compliance: 0,
  unilateral: false,
  force: 0,
  elongation: 0,
};

function solveBoundCollide(p0) {
  // console.log("CHECK");
  // console.log(p0.pos);
  obj = p0;
  o_radius = pointSize * obj.size;
  var px = canvasOrig.x + obj.pos.x * drawScale;
  var py = canvasOrig.y - obj.pos.y * drawScale;
  var R = px + o_radius;
  var D = py + o_radius;
  var U = py - o_radius;
  var L = px - o_radius;
  var d0 = o_radius + o_radius;
  var p1 = ptmp;
  p1.invMass = p0.invMass;
  p1.radius = p0.radius;
  p1.size = p0.size;
  p1.pos.x = p0.pos.x;
  p1.pos.y = p0.pos.y;

  var rad = (o_radius / 500) * 2;
  if (D >= 500) {
    p1.pos.x = p0.pos.x;
    p1.pos.y = p0.pos.y;
    p1.pos.y = -1.5 - rad;
    solvePosCollide(p0, p1, d0, 1, 0.001);
  }
  if (U <= 0) {
    // up 0.5
    p1.pos.x = p0.pos.x;
    p1.pos.y = p0.pos.y;
    p1.pos.y = 0.5 + rad;
    solvePosCollide(p0, p1, d0, 1, 0.001);
  }
  if (L <= 0) {
    // left -1
    p1.pos.x = p0.pos.x;
    p1.pos.y = p0.pos.y;
    p1.pos.x = -1 - rad;
    solvePosCollide(p0, p1, d0, 1, 0.001);
  }
  if (R >= 500) {
    p1.pos.x = p0.pos.x;
    p1.pos.y = p0.pos.y;
    p1.pos.x = 1 + rad;
    solvePosCollide(p0, p1, d0, 1, 0.001);
  }
  // console.log(p0.pos, p1.pos);
  solvePosCollide(p0, p1, d0, 1, 0.001);
}

function simulate(dt) {
  var sdt = dt / numSubsteps;
  var step;
  for (step = 0; step < numSubsteps; step++) {
    // predict

    for (i = 1; i < numPoints; i++) {
      p = points[i];
      p.vel.y -= gravity * sdt;
      p.prev.assign(p.pos);
      p.pos.add(p.vel, sdt);
    }

    for (i = 0; i < numObjects; i++) {
      p = collisionObjects[i];
      if (!isFloat) {
        p.vel.y -= gravity * sdt;
      }
      p.prev.assign(p.pos);
      p.pos.add(p.vel, sdt);
    }

    // solve positions

    for (i = 0; i < numPoints - 1; i++) {
      p = points[i + 1];
      solveDistPos(points[i], p, p.radius, p.compliance, p.unilateral, sdt);
    }

    if (grabPointNr >= 0)
      solveDistPos(
        grabPoint,
        points[grabPointNr],
        0,
        mouseCompliance,
        false,
        sdt
      );

    if (collisionHandling) {
      var minX = 0;
      p = points[numPoints - 1];
      if (p.pos.x < minX) {
        p.pos.x = minX;
        if (p.vel.x < 0) p.prev.x = p.pos.x + p.vel.x * sdt;
      }
    }

    // TODO: Add our collision detection
    for (i = 1; i < numPoints; i++) {
      p = points[i];
      for (j = 0; j < numObjects; j++) {
        obj = collisionObjects[j];
        if (collide(p, obj)) {
          p_radius = pointSize * p.size;
          o_radius = pointSize * obj.size;
          bound_dist = p_radius + o_radius;
          solvePosCollide(p, obj, bound_dist);
        }
      }
    }
    // TODO: Add collision with boundary
    for (j = 0; j < numObjects; j++) {
      obj = collisionObjects[j];
      if (boundCollide(obj)) {
        solveBoundCollide(obj);
      }
    }

    for (i = 0; i < numObjects; i++) {
      for (j = i + 1; j < numObjects; j++) {
        p0 = collisionObjects[i];
        p1 = collisionObjects[j];
        if (collide(p0, p1)) {
          p0_radius = pointSize * p0.size;
          p1_radius = pointSize * p1.size;
          bound_dist = p0_radius + p1_radius;
          solvePosCollide(p0, p1, bound_dist);
        }
      }
    }

    // update velocities pendulum
    for (i = 1; i < numPoints; i++) {
      p = points[i];
      p.vel = p.pos.minus(p.prev);
      p.vel.scale(1 / sdt);
      solvePointVel(p, globalDampingCoeff, sdt);
    }
    // update velocities objects
    for (i = 0; i < numObjects; i++) {
      p = collisionObjects[i];
      p.vel = p.pos.minus(p.prev);
      p.vel.scale(1 / sdt);
      // solvePointVel(p, globalDampingCoeff, sdt);
    }

    for (i = 0; i < numPoints - 1; i++) {
      p = points[i + 1];
      if (p.compliance > 0.0) solveDistVel(points[i], p, edgeDampingCoeff, sdt);
    }
    if (grabPointNr >= 0)
      solveDistVel(grabPoint, points[grabPointNr], mouseDampingCoeff, sdt);

    if (showTrail) trailAdd(points[numPoints - 1].pos);
  }
}

// ---------------------------------------------------------------------------------------

// energy conservation

function computeEnergy() {
  var E = 0;
  for (i = 1; i < numPoints; i++) {
    p = points[i];
    E +=
      (p.pos.y / p.invMass) * gravity + (0.5 / p.invMass) * p.vel.lenSquared();
  }
  return E;
}

function forceEnergyConservation(prevE) {
  var dE = (computeEnergy() - prevE) / (numPoints - 1);
  if (dE < 0) {
    var postE = computeEnergy();

    for (i = 1; i < numPoints; i++) {
      p = points[i];
      var Ek = (0.5 / p.invMass) * p.vel.lenSquared();
      var s = Math.sqrt((Ek - dE) / Ek);
      p.vel.scale(s);
    }
  }
}

// animation

var requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;

var timeFrames = 0;
var timeSum = 0;
var paused = false;

function timeStep() {
  var prevE;
  if (conserveEnergy) prevE = computeEnergy();
  var startTime = performance.now();

  simulate(dt);

  var endTime = performance.now();
  if (conserveEnergy) forceEnergyConservation(prevE);

  timeSum += endTime - startTime;
  timeFrames++;

  if (timeFrames > 10) {
    timeSum /= timeFrames;
    document.getElementById("ms").innerHTML = timeSum.toFixed(3);
    timeFrames = 0;
    timeSum = 0;
  }

  draw();
  if (!paused) requestAnimationFrame(timeStep);
}

function step() {
  paused = true;
  timeStep();
}

function run() {
  if (paused) {
    paused = false;
    timeStep();
  }
}

// mouse grab

var grabPointNr = -1;
var grabPoint = { pos: new Vector(), invMass: 0, vel: new Vector() };
var maxGrabDist = 0.5;
var prevConserveEnergy = conserveEnergy;

function onMouse(evt) {
  evt.preventDefault();
  var rect = canvas.getBoundingClientRect();
  var mousePos = new Vector(
    (evt.clientX - rect.left - canvasOrig.x) / drawScale,
    (canvasOrig.y - (evt.clientY - rect.top)) / drawScale
  );
  if (evt.type == "mousedown") {
    grabPointNr = -1;
    var minGrabDist2 = maxGrabDist * maxGrabDist;
    for (i = 1; i < numPoints; i++) {
      p = points[i];
      var d2 = p.pos.distSquared(mousePos);
      if (d2 < minGrabDist2) {
        minGrabDist2 = d2;
        grabPointNr = i;
        grabPoint.pos.assign(mousePos);
        prevConserveEnergy = conserveEnergy;
        conserveEnergy = false;
      }
    }
  } else if (evt.type == "mousemove") {
    grabPoint.pos.assign(mousePos);
  } else if (evt.type == "mouseup" || evt.type == "mouseout") {
    grabPointNr = -1;
    conserveEnergy = prevConserveEnergy;
  }
}

canvas.addEventListener("mousedown", onMouse);
canvas.addEventListener("mousemove", onMouse);
canvas.addEventListener("mouseup", onMouse);
canvas.addEventListener("mouseout", onMouse);

// main

resetPos(false);
timeStep();
