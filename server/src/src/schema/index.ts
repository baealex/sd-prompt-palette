import { makeExecutableSchema } from '@graphql-tools/schema';
import { categoryResolvers, categoryTypeDefs } from './category';
import { keywordResolvers, keywordTypeDefs } from './keyword';
import { userResolvers, userTypeDefs } from './user';

const schema = makeExecutableSchema({
    typeDefs: [
        categoryTypeDefs,
        keywordTypeDefs,
        userTypeDefs,
    ],
    resolvers: [
        categoryResolvers,
        keywordResolvers,
        userResolvers,
    ],
});

export default schema;
