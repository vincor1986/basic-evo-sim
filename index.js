const canvas = document.querySelector("canvas");
const SIZE = 30;
canvas.height = (SIZE * 10).toString();
canvas.width = (SIZE * 10).toString();
const flySize = 10;
const frogSize = 20;
const flyQty = 30;
const frogQty = 6;
const POP_LIMIT = 100;
let flyCount = 0,
  frogCount = 0;

let c = canvas.getContext("2d");

const drawEntity = (x, y, colour, type = "fly") => {
  c.fillStyle = colour;
  const size = type === "fly" ? flySize : frogSize;
  c.fillRect(x * 10, y * 10, size, size);
};

const moveEntity = (entity, [destX, destY]) => {
  if (entity.moving) return false;
  entity.moving = true;
  const [x, y] = entity.location;
  const xDiff = +((destX - x) / 10).toFixed(1);
  const yDiff = +((destY - y) / 10).toFixed(1);

  const adjustLocation = () => {
    entity.location[0] =
      destX < x
        ? Math.max(destX, +(entity.location[0] + xDiff).toFixed(1))
        : destX === x
        ? entity.location[0]
        : Math.min(destX, +(entity.location[0] + xDiff).toFixed(1));
    entity.location[1] =
      destY < y
        ? Math.max(destY, +(entity.location[1] + yDiff).toFixed(1))
        : destY === y
        ? entity.location[1]
        : Math.min(destY, +(entity.location[1] + yDiff).toFixed(1));

    if (entity.location[0] === destX && entity.location[1] === destY) {
      entity.moving = false;
      clearInterval(interval);
    }
  };

  let interval = setInterval(adjustLocation, 20);
};

const animate = () => {
  let all = [...eggs, ...population, ...frogs];
  c.fillStyle = "#eee";
  c.fillRect(0, 0, SIZE * 10, SIZE * 10);
  for (let i = 0; i < all.length; i++) {
    const entity = all[i];
    const size = entity.size;
    const [x, y] = entity.location;
    c.fillStyle = entity.colour;
    c.fillRect(x * 10, y * 10, size, size);
  }
  requestAnimationFrame(animate);
};

const isUnderFrog = (location) => {
  let covers = frogs.map((frog) => frog.locationStr);
  frogs.forEach((frog) => covers.push(...frog.covers));
  return covers.includes(location);
};

const entityDeath = (entity, type = population) => {
  const [x, y] = entity.location;
  const size = entity.size;
  type === population ||
    (type === eggs &&
      !isUnderFrog(entity.locationStr) &&
      c.clearRect(x * 10, y * 10, size, size));
  type === frogs && c.clearRect(x * 10, y * 10, size, size);
  const id = entity.id;
  type.forEach((ent, index, array) => {
    if (ent.id === id) {
      array.splice(index, 1);
    }
  });
};

const findSurrounding = (x, y) => {
  let surrounding = [
    [x + 1, y],
    [x + 1, y - 1],
    [x + 1, y + 1],
    [x, y + 1],
    [x, y - 1],
    [x - 1, y],
    [x - 1, y - 1],
    [x - 1, y + 1],
  ].map(([a, b]) => [Math.floor(a), Math.floor(b)]);

  return surrounding
    .filter((arr) => {
      return !outOfBounds(arr[0], arr[1]);
    })
    .map((arr) => arr.toString())
    .sort((_, __) => Math.random - 0.5);
};

const frogFindSurrounding = (x, y) => {
  let surrounding = [
    [x + 2, y],
    [x + 2, y - 1],
    [x + 2, y + 1],
    [x + 2, y + 2],
    [x, y + 2],
    [x, y - 1],
    [x + 1, y - 1],
    [x + 1, y + 2],
    [x - 1, y],
    [x - 1, y - 1],
    [x - 1, y + 1],
    [x - 1, y + 2],
  ];

  return surrounding
    .filter((arr) => {
      return !outOfBounds(arr[0], arr[1]);
    })
    .map((arr) => arr.toString());
};

const frogSpawnLocations = (x, y) => {
  let surrounding = [
    [x - 2, y - 2],
    [x - 2, y - 1],
    [x - 2, y],
    [x - 2, y + 1],
    [x - 2, y + 2],
    [x - 1, y - 2],
    [x - 1, y + 2],
    [x, y - 2],
    [x, y + 2],
    [x + 1, y - 2],
    [x + 1, y + 2],
    [x + 2, y - 2],
    [x + 2, y - 1],
    [x + 2, y],
    [x + 2, y + 1],
    [x + 2, y + 2],
  ];

  return surrounding
    .filter((arr) => {
      const array = [
        [arr[0], arr[1]],
        [arr[0] + 1, arr[1]],
        [arr[0], arr[1] + 1],
        [arr[0] + 1, arr[1] + 1],
      ];
      return (
        array.filter((c) => !outOfBounds(c[0], c[1]) && !occupied(c[0], c[1]))
          .length === 4
      );
    })
    .map((arr) => arr.toString());
};

const choosePosition = () => {
  const x = Math.floor(Math.random() * SIZE);
  const y = Math.floor(Math.random() * SIZE);
  const locations = population.map((fly) => fly.locationStr);
  locations.push(...frogs.map((frog) => frog.locationStr));
  locations.push(...frogs.reduce((a, b) => a.concat(...b.covers), []));
  if (!locations.includes([x, y].toString())) {
    return [x, y];
  } else {
    return choosePosition();
  }
};

const random = () => {
  return Math.floor(Math.random() * 4) + 1;
};

const defaultGenes = {
  mobility: 1,
  lifeSpan: 250,
  leader: true,
};

const inheritGenes = (parentA, parentB) => {
  if (!parentA || !parentB) return defaultGenes;
  const aGenes = parentA.genes,
    bGenes = parentB.genes;
  let genes = {};
  const allGenes = Object.keys(aGenes);
  allGenes.forEach((set) => {
    genes[set] = Math.random() > 0.5 ? aGenes[set] : bGenes[set];
  });
  const mutate = Math.random() < 0.1;
  if (mutate) {
    const increment = Math.random() > 0.5 ? 1 : -1;
    const index = Math.floor(Math.random() * allGenes.length);
    if (typeof genes[allGenes[index]] === "number") {
      genes[allGenes[index]] = Math.max(genes[allGenes[index]] + increment, 1);
    } else {
      genes[allGenes[index]] = !genes[allGenes[index]];
    }
  }
  return genes;
};

class Fly {
  constructor(parentA, parentB, id) {
    this.parents = [parentA, parentB];
    this.age = 0;
    this.genes = inheritGenes(parentA, parentB);
    this.genes.pheromones = random();
    this.gender = Math.random() > 0.5 ? "f" : "m";
    this.colour = this.gender === "m" ? "skyblue" : "pink";
    this.id = id;
    this.location = [];
    this.locationStr = "";
    this.children = 0;
    this.size = flySize;
    this.pregnant = false;
    this.father = false;
  }
}

class Frog {
  constructor(id) {
    this.location = [];
    this.locationStr = "";
    this.covers = [];
    this.id = id;
    this.gender =
      id === 0 ? "m" : id === 1 ? "f" : Math.random() > 0.5 ? "m" : "f";
    this.colour = this.gender === "m" ? "darkgreen" : "lightgreen";
    this.genes =
      id < frogQty
        ? { mobility: 3, survival: 150, hopRate: 8, efficiency: 5 }
        : {};
    this.genes.pheromones = random();
    this.age = 0;
    this.hunger = 0;
    this.size = frogSize;
    this.pregnant = false;
    this.father = false;
  }
}

let eggCount = 0;

class Egg {
  constructor(type, [parentA, parentB]) {
    this.hatchtime = 18;
    this.location = [];
    this.parents = [parentA, parentB];
    this.type = type;
    this.colour = type === "frog" ? "yellow" : "black";
    this.size = this.type === "frog" ? 5 : 3;
    this.id = eggCount;
    eggCount++;
  }
}

const eggs = [];

const population = [],
  frogs = [];

const GENESIS = new Fly([], flyCount);
flyCount++;
population.push(GENESIS);

for (let i = 0; i < flyQty; i++) {
  const newFly = new Fly(GENESIS, GENESIS, flyCount);
  flyCount++;
  population.push(newFly);
}

population.shift();

for (let i = 0; i < frogQty; i++) {
  const newfrog = new Frog(frogCount);
  frogCount++;
  const position = choosePosition();
  newfrog.locationStr = position.toString();
  newfrog.location = position;
  const [x, y] = position;
  newfrog.covers = [
    [x + 1, y + 1].toString(),
    [x + 1, y].toString(),
    [x, y + 1].toString(),
  ];
  frogs.push(newfrog);
  drawEntity(x, y, newfrog.colour, "frogs");
}

population.forEach((fly) => {
  const location = choosePosition();
  fly.location = location;
  fly.locationStr = location.toString();
  const [x, y] = location;
  const colour = fly.gender === "m" ? "blue" : "pink";
  drawEntity(x, y, colour);
});

const occupied = (x, y, type = "") => {
  checkString = [Math.floor(x), Math.floor(y)].toString();
  let covers = [];
  frogs.forEach((frog) => covers.push(...frog.covers));

  if (type === "") {
    return (
      population.map((entity) => entity.locationStr).includes(checkString) ||
      frogs.map((frog) => frog.locationStr).includes(checkString) ||
      covers.includes(checkString)
    );
  } else if (type === "frogs") {
    return (
      frogs.map((frog) => frog.locationStr).includes(checkString) ||
      covers.includes(checkString)
    );
  }
};

const available = (surrounding) => {
  return surrounding.filter((locationStr) => {
    let [x, y] = locationStr.split(",").map((val) => +val);
    return !occupied(x, y);
  });
};

const outOfBounds = (x, y) => {
  return x < 0 || x >= SIZE || y < 0 || y >= SIZE;
};

const getRandomDestination = (entity, type = population) => {
  let [x, y] = entity.location;
  x = Math.round(x);
  y = Math.round(y);
  const m = entity.genes.mobility;

  let available = [
    [x - m, y],
    [x - m, y - m],
    [x - m, y + m],
    [x, y - m],
    [x, y + m],
    [x + m, y],
    [x + m, y - m],
    [x + m, y + m],
  ]
    .filter((arr) => !outOfBounds(arr[0], arr[1]) && !occupied(arr[0], arr[1]))
    .sort((_, __) => Math.random() - 0.5);

  if (type === frogs) {
    available = available.filter((arr) => {
      const [fX, fY] = arr;
      return (
        !occupied(fX + 1, fY, "frogs") &&
        !outOfBounds(fX + 1, fY) &&
        !occupied(fX, fY + 1, "frogs") &&
        !outOfBounds(fX, fY + 1) &&
        !occupied(fX + 1, fY + 1, "frogs") &&
        !outOfBounds(fX + 1, fY + 1)
      );
    });
  }

  return available.length === 0
    ? [x, y]
    : available[Math.floor(Math.random() * available.length)];
};

const getFollowDest = (fly, type = population) => {
  const [x, y] = fly.location.map((val) => Math.round(val));
  const surrounding = findSurrounding(x, y);
  let dest = [];
  type
    .sort((_, __) => Math.random() - 0.5)
    .forEach((other) => {
      if (other.id === fly.id) return;
      const [otherX, otherY] = other.location;
      if (
        [Math.round(x), Math.round(y)].toString() ===
        [Math.round(otherX), Math.round(otherY)].toString()
      )
        return;
      const otherSurrounding = findSurrounding(otherX, otherY);
      for (let i = 0; i < otherSurrounding.length; i++) {
        const coord = otherSurrounding[i];
        const [lX, lY] = coord.split(",").map((val) => Math.round(+val));
        if (surrounding.includes(coord) && !occupied(lX, lY)) {
          dest.push([lX, lY]);
        }
      }
    });
  return dest.length === 0
    ? getRandomDestination(fly, type)
    : dest[Math.floor(Math.random() * dest.length)];
};

animate();

setInterval(() => {
  if (flyCount % 20 === 0) {
    console.log("Flies", population);
    console.log("Frogs", frogs);
    console.log("Eggs", eggs);
  }
  eggs.forEach((egg) => {
    if (egg.hatchtime === 0) {
      for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        const surrounding = findSurrounding(egg.location[0], egg.location[1]);
        const newFly = new Fly(egg.parents[0], egg.parents[1], flyCount);
        newFly.locationStr =
          surrounding[Math.floor(Math.random() * surrounding.length)];
        newFly.location = newFly.locationStr.split(",").map((val) => +val);
        if (newFly.genes.leader === false) {
          if (newFly.gender === "m") {
            newFly.colour = "purple";
          } else {
            newFly.colour = "violet";
          }
        }
        population.push(newFly);
        flyCount++;
      }
      entityDeath(egg, eggs);
    } else {
      egg.hatchtime--;
    }
  });
  population.forEach((fly) => {
    if (fly.pregnant !== false) {
      if (fly.pregnant >= 12) {
        const newEgg = new Egg("fly", [
          fly,
          population.filter((f) => f.id === fly.father)[0],
        ]);
        const buffer = 0.5 * fly.size * 0.1 - 0.5 * newEgg.size * 0.1;
        console.log("buffer", buffer);
        newEgg.location = [fly.location[0] + buffer, fly.location[1] + buffer];
        eggs.push(newEgg);
        fly.pregnant = false;
        fly.father = false;
      } else {
        fly.pregnant++;
      }
    }
    const dest = fly.genes.leader
      ? getRandomDestination(fly)
      : getFollowDest(fly);
    const movement = moveEntity(fly, dest);
    if (movement === false) return;
    setTimeout(() => {
      fly.locationStr = [Math.floor(dest[0]), Math.floor(dest[1])].toString();
    }, 200);
    fly.age++;
    if (fly.maternal) {
      if (fly.maternal > 5) {
        delete fly.maternal;
      } else {
        fly.maternal++;
      }
    }
    const surrounding = findSurrounding(
      Math.floor(dest[0]),
      Math.floor(dest[1])
    );
    for (let i = 0; i < population.length; i++) {
      const partnerFly = population[i];
      let birth = false;
      if (fly.age > 19 && !fly.maternal && fly.gender === "f") {
        if (
          surrounding.includes(partnerFly.locationStr) &&
          available(surrounding).length > 0 &&
          population.length + eggs.length * 4 < POP_LIMIT &&
          [4, 6].includes(fly.genes.pheromones + partnerFly.genes.pheromones) &&
          partnerFly.gender !== fly.gender &&
          partnerFly.age > 19 &&
          !partnerFly.maternal
        ) {
          fly.pregnant = 0;
          fly.father = partnerFly.id;

          birth = true;
          if (fly.gender === "f") {
            fly.maternal = 1;
          } else {
            partnerFly.maternal = 1;
          }
        }
      }
      if (birth) break;
    }

    if (fly.age === fly.genes.lifeSpan) {
      entityDeath(fly, population);
    }
    let death = false;
    frogs.forEach((frog) => {
      if (death) return;
      if (
        (frog.covers.includes(fly.locationStr) ||
          frog.locationStr === fly.locationStr) &&
        Math.random() > frog.efficiency * 0.1
      ) {
        entityDeath(fly, population);
        frog.hunger = 0;
        death = true;
      }
      surrounding.forEach((coordinate) => {
        if (death) return;
        if (
          frog.covers.includes(coordinate) ||
          coordinate === frog.locationStr
        ) {
          if (Math.random() > 0.5) {
            entityDeath(fly, population);
            frog.hunger = 0;
            death = true;
          }
        }
      });
    });
  });

  frogs.forEach((frog) => {
    frog.age++;
    frog.hunger++;
    if (frog.hunger > frog.genes.survival) {
      entityDeath(frog, frogs);
      return;
    }
    if (frog.pregnant !== false) {
      if (frog.pregnant === 12) {
        const newEgg = new Eggs("frog", [
          frog,
          frogs.filter((f) => f.id === frog.father),
        ]);
        newEgg.location = frog.location;
        frog.pregnant = false;
        frog.father = false;
      } else {
        frog.pregnant++;
      }
    }
    const curr = frog.location;
    let dest;
    if (Math.random() > frog.genes.hopRate / 10) {
      dest = getRandomDestination(frog, frogs);
      const movement = moveEntity(frog, dest);
      if (movement === false) return;
      setTimeout(() => {
        frog.locationStr = [
          Math.floor(dest[0]),
          Math.floor(dest[1]),
        ].toString();
      }, 200);
      const [dX, dY] = dest;
      setTimeout(() => {
        frog.covers = [
          [Math.floor(dX + 1), Math.floor(dY + 1)].toString(),
          [Math.floor(dX), Math.floor(dY + 1)].toString(),
          [Math.floor(dX + 1), Math.floor(dY)].toString(),
        ];
      }, 200);
    }
    if (dest === undefined) {
      dest = curr;
    }
    const surrounding = frogFindSurrounding(dest[0], dest[1]);
    if (frog.maternal) {
      if (frog.maternal > 35) {
        delete frog.maternal;
      } else {
        frog.maternal++;
      }
    }
    if (!frog.maternal && frog.age > 49) {
      for (let i = 0; i < frogs.length; i++) {
        const partnerFrog = frogs[i];
        let birth = false;
        const partnerFrogLocations = [
          partnerFrog.locationStr,
          ...partnerFrog.covers,
        ];
        const isLocal =
          partnerFrogLocations.filter((str) => surrounding.includes(str))
            .length > 0;
        if (
          isLocal &&
          partnerFrog.gender !== frog.gender &&
          [4, 6].includes(
            frog.genes.pheromones + partnerFrog.genes.pheromones
          ) &&
          !partnerFrog.maternal &&
          partnerFrog.age > 49 &&
          frogs.length < population.length / 7.5
        ) {
          const possibleLocations = frogSpawnLocations(dest[0], dest[1]);
          if (possibleLocations.length === 0) {
            break;
          }
          const newFrog = new Frog(frogCount);
          frogCount++;
          newFrog.locationStr =
            possibleLocations[
              Math.floor(Math.random() * possibleLocations.length)
            ];
          newFrog.location = newFrog.locationStr.split(",").map((val) => +val);
          newFrog.genes = inheritGenes(frog, partnerFrog);
          frogs.push(newFrog);
          birth = true;
          partnerFrog.maternal = 1;
          frog.maternal = 1;
        }
        if (birth) break;
      }
    }
  });
}, 250);
