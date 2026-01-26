/*!
 * GeneticAlgorithm - Optimization Engine for Part Placement
 * Licensed under GPLv3
 *
 * @fileoverview
 * This module implements a Genetic Algorithm for optimizing the order and
 * rotation of parts in a nesting problem. The GA evolves a population of
 * candidate solutions to find arrangements that minimize material waste.
 *
 * @module GeneticAlgorithm
 */

/**
 * Genetic Algorithm for optimizing part placement order and rotation.
 *
 * ## How Genetic Algorithms Work (for Junior Developers)
 *
 * A GA mimics natural evolution to find good solutions:
 *
 * 1. **Population**: A group of "individuals", each representing a different solution
 * 2. **Individual**: One specific arrangement (order + rotations of all parts)
 * 3. **Fitness**: How good a solution is (lower = parts fit better on fewer sheets)
 * 4. **Selection**: Better individuals are more likely to reproduce
 * 5. **Crossover**: Two parents combine to create children (mixing their arrangements)
 * 6. **Mutation**: Random changes to prevent getting stuck in local optima
 *
 * ## In This Implementation
 *
 * - **Gene**: An array of parts in a specific order + their rotation angles
 * - **Fitness**: Computed by background workers (total material used)
 * - **Selection**: Weighted random - fitter individuals more likely chosen
 * - **Crossover**: Single-point - cut at random position, swap halves
 * - **Mutation**: Swap adjacent parts or change rotation angle
 * - **Elitism**: Best individual always survives to next generation
 *
 * @class GeneticAlgorithm
 */
export class GeneticAlgorithm {
  /**
   * Creates a new GA instance with an initial population.
   *
   * @param {Array<Polygon>} adam - The seed individual (first arrangement to try)
   * @param {NestConfig} config - Configuration with populationSize, mutationRate, rotations
   */
  constructor(adam, config) {
    this.config = config || {
      populationSize: 10,
      mutationRate: 10,
      rotations: 4,
    };

    // Generate random initial rotation for each part in Adam
    // Rotations are quantized (e.g., 4 rotations = 0°, 90°, 180°, 270°)
    var angles = [];
    for (var i = 0; i < adam.length; i++) {
      var angle =
        Math.floor(Math.random() * this.config.rotations) *
        (360 / this.config.rotations);
      angles.push(angle);
    }

    // Adam is the first individual in the population
    this.population = [{ placement: adam, rotation: angles }];

    // Fill remaining population with mutated copies of Adam
    while (this.population.length < config.populationSize) {
      var mutant = this.mutate(this.population[0]);
      this.population.push(mutant);
    }
  }

  /**
   * Creates a mutated copy of an individual.
   *
   * Two types of mutations can occur (each with probability = mutationRate%):
   * 1. **Order mutation**: Swap a part with the next part in sequence
   * 2. **Rotation mutation**: Assign a random new rotation angle
   *
   * @param {{placement: Array, rotation: Array}} individual - Individual to mutate
   * @returns {{placement: Array, rotation: Array}} New mutated individual
   */
  mutate(individual) {
    var clone = {
      placement: individual.placement.slice(0),
      rotation: individual.rotation.slice(0),
    };

    for (var i = 0; i < clone.placement.length; i++) {
      // Mutation 1: Swap order with next part
      var rand = Math.random();
      if (rand < 0.01 * this.config.mutationRate) {
        var j = i + 1;
        if (j < clone.placement.length) {
          var temp = clone.placement[i];
          clone.placement[i] = clone.placement[j];
          clone.placement[j] = temp;
        }
      }

      // Mutation 2: Random rotation change
      rand = Math.random();
      if (rand < 0.01 * this.config.mutationRate) {
        clone.rotation[i] =
          Math.floor(Math.random() * this.config.rotations) *
          (360 / this.config.rotations);
      }
    }

    return clone;
  }

  /**
   * Combines two parent individuals to create two children (crossover).
   *
   * Uses single-point crossover with order preservation:
   * 1. Pick a random cut point (between 10%-90% of length)
   * 2. Child 1: Male's parts before cut + Female's remaining parts (in her order)
   * 3. Child 2: Female's parts before cut + Male's remaining parts (in his order)
   *
   * This ensures each child has all parts exactly once (valid permutation).
   *
   * @param {{placement: Array, rotation: Array}} male - First parent
   * @param {{placement: Array, rotation: Array}} female - Second parent
   * @returns {Array<{placement: Array, rotation: Array}>} Two children
   */
  mate(male, female) {
    // Cut point between 10% and 90% to ensure meaningful crossover
    var cutpoint = Math.round(
      Math.min(Math.max(Math.random(), 0.1), 0.9) * (male.placement.length - 1),
    );

    // Take first portion from each parent
    var gene1 = male.placement.slice(0, cutpoint);
    var rot1 = male.rotation.slice(0, cutpoint);

    var gene2 = female.placement.slice(0, cutpoint);
    var rot2 = female.rotation.slice(0, cutpoint);

    // Fill remaining slots with parts from the other parent (preserving their order)
    for (var i = 0; i < female.placement.length; i++) {
      if (!contains(gene1, female.placement[i].id)) {
        gene1.push(female.placement[i]);
        rot1.push(female.rotation[i]);
      }
    }

    for (var i = 0; i < male.placement.length; i++) {
      if (!contains(gene2, male.placement[i].id)) {
        gene2.push(male.placement[i]);
        rot2.push(male.rotation[i]);
      }
    }

    // Helper: check if a part ID is already in a gene
    function contains(gene, id) {
      for (var i = 0; i < gene.length; i++) {
        if (gene[i].id == id) {
          return true;
        }
      }
      return false;
    }

    return [
      { placement: gene1, rotation: rot1 },
      { placement: gene2, rotation: rot2 },
    ];
  }

  /**
   * Advances to the next generation.
   *
   * ## Process
   * 1. Sort population by fitness (best first)
   * 2. Keep the best individual unchanged (elitism)
   * 3. Select pairs of parents (weighted toward fitter individuals)
   * 4. Create children via crossover
   * 5. Mutate children
   * 6. Replace old population with new generation
   */
  generation() {
    // Sort by fitness (lower is better)
    this.population.sort(function (a, b) {
      return a.fitness - b.fitness;
    });

    // Elitism: preserve the best individual unchanged
    var newpopulation = [this.population[0]];

    // Fill rest of population with offspring
    while (newpopulation.length < this.population.length) {
      var male = this.randomWeightedIndividual();
      var female = this.randomWeightedIndividual(male);

      var children = this.mate(male, female);

      // Mutate both children before adding to population
      newpopulation.push(this.mutate(children[0]));

      if (newpopulation.length < this.population.length) {
        newpopulation.push(this.mutate(children[1]));
      }
    }

    this.population = newpopulation;
  }

  /**
   * Selects a random individual, weighted toward fitter ones.
   *
   * Uses a triangular probability distribution: individuals at the front
   * of the sorted population (better fitness) have higher selection probability.
   *
   * @param {{placement: Array, rotation: Array}} [exclude] - Individual to exclude (e.g., already selected as male)
   * @returns {{placement: Array, rotation: Array}} Selected individual
   */
  randomWeightedIndividual(exclude) {
    var pop = this.population.slice(0);

    // Remove excluded individual (prevents self-mating)
    if (exclude && pop.indexOf(exclude) >= 0) {
      pop.splice(pop.indexOf(exclude), 1);
    }

    var rand = Math.random();

    // Weighted selection: earlier (fitter) individuals get larger probability ranges
    var lower = 0;
    var weight = 1 / pop.length;
    var upper = weight;

    for (var i = 0; i < pop.length; i++) {
      if (rand > lower && rand < upper) {
        return pop[i];
      }
      lower = upper;
      // Weight decreases linearly for later (less fit) individuals
      upper += 2 * weight * ((pop.length - i) / pop.length);
    }

    return pop[0];
  }
}
