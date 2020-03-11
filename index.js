const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  enum Status {
    WATCHED
    INTERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String!
  }

  type Movie {
    id: ID!
    title: String
    releaseDate: String
    rating: Int
    status: Status
    actor: [Actor]
  }

  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }
`;

const movies = [
  {
    id: "dasdgfsgdjhgjhjg",
    title: "5 Deadly Venoms",
    releaseDate: "10-10-1983",
    rating: 4,
    actor: [{ id: "asdsadasdds", name: "Gordon Liu" }]
  },
  {
    id: "dasdklsdjfgej",
    title: "36th Chamber",
    releaseDate: "10-08-1982",
    rating: 5
  }
];

const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },
    movie: (obj, { id }, context, info) => {
      const foundMovie = movies.find(movie => movie.id === id);
      return foundMovie;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => console.log(`Server started at ${url}`));
