import simulationConfig from './simulationConfig.json';

const simulateEvent = (eventType: string) => {
  console.log(`Simulating event: ${eventType}`);
  // Implement the logic for simulating the event here
};

const runSimulation = () => {
  console.log('Starting simulation...');
  const { numSimulatedUsers, eventTypes, simulationDuration } = simulationConfig;

  for (let i = 0; i < simulationDuration; i++) {
    eventTypes.forEach((eventType) => {
      // Generate a random number between 0 and 1
      const randomNumber = Math.random();

      // If the random number is less than the event rate, simulate the event
      if (randomNumber < 0.5) {
        simulateEvent(eventType);
      }
    });
  }

  console.log('Simulation complete.');
};

export default runSimulation;