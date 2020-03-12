const { ApolloServer, gql, PubSub } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://kungfu:kungfu@cluster0-hfnvm.mongodb.net/test?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);
const db = mongoose.connection;

const movieSchema = new mongoose.Schema({
  title: String,
  releaseDate: Date,
  rating: Number,
  status: String,
  actorIds: [String]
});

const Movie = mongoose.model("Movie", movieSchema);

const typeDefs = gql`
  # fragment Meta on Movie {
  #   releaseDate
  #   rating
  # }

  scalar Date

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
    title: String!
    releaseDate: Date
    rating: Int
    status: Status
    actor: [Actor]
  }

  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }

  input ActorInput {
    id: ID
  }

  input MovieInput {
    id: ID
    title: String
    releaseDate: Date
    rating: Int
    status: Status
    actor: [ActorInput]
  }

  type Mutation {
    addMovie(movie: MovieInput): [Movie]
  }

  type Subscription {
    movieAdded: Movie
  }
`;

const actors = [
  {
    id: "gordon",
    name: "Gordon Liu"
  },
  {
    id: "jackie",
    name: "Jackie Chan"
  }
];

const movies = [
  {
    id: "dasdgfsgdjhgjhjg",
    title: "5 Deadly Venoms",
    releaseDate: new Date("10-10-1983"),
    rating: 4,
    actor: [{ id: "jackie" }]
  },
  {
    id: "dasdklsdjfgej",
    title: "36th Chamber",
    releaseDate: new Date("10-08-1982"),
    rating: 5,
    actor: [{ id: "gordon" }]
  }
];

const pubsub = new PubSub();
const MOVIE_ADDED = "MOVIE_ADDED";

const resolvers = {
  Subscription: {
    movieAdded: {
      subscribe: () => pubsub.asyncIterator([MOVIE_ADDED])
    }
  },
  Query: {
    movies: async () => {
      try {
        const allMovies = await Movie.find();
        return allMovies;
      } catch (error) {
        console.log("error", error);
        return [];
      }
    },
    movie: async (obj, { id }) => {
      try {
        const foundMovie = await Movie.findById(id);
        return foundMovie;
      } catch (error) {
        console.log("error", error);
        return [];
      }
    }
  },
  Movie: {
    actor: (obj, arg, context) => {
      const actorsId = obj.actor.map(actor => actor.id);
      const filteredActors = actors.filter(actor => {
        return actorsId.includes(actor.id);
      });
      return filteredActors;
    }
  },
  Mutation: {
    addMovie: async (obj, { movie }, { userId }) => {
      try {
        if (userId) {
          const newMovie = await Movie.create({
            ...movie
          });
          pubsub.publish(MOVIE_ADDED, { movieAdded: newMovie });
          const allMovies = await Movie.find();
          return allMovies;
        }
        return movies;
      } catch (error) {
        console.log("error", error);
        return [];
      }
    }
  },
  Date: new GraphQLScalarType({
    name: "Date",
    description: "it is a date, deal with it",
    parseValue(value) {
      return new Date(value);
    },
    serialize(value) {
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
      return null;
    }
  })
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    const fakeUser = {
      userId: "helloIAmUser"
    };
    return { ...fakeUser };
  }
});

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("*************DATABASE CONNECTED*************");
  server
    .listen({
      port: process.env.PORT || 4000
    })
    .then(({ url }) => console.log(`Server started at ${url}`));
});
