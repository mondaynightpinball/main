const season = require('../model/seasons').get();
const IPR = require('../model/ratings');

const {teams} = season;

const unknowns = Object.keys(teams)
  .map(tk => {
    return teams[tk].roster.map(({name}) => name);
    // ({
    //   name,
    //   team: tk
    // }));
  })
  .reduce((list, roster) => {
    return [
      ...list,
      ...roster.filter(name => IPR.forName(name) === 0)
    ];
  }, []);

unknowns.forEach(name => console.log(name));
