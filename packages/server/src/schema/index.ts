import { makeExecutableSchema } from '@graphql-tools/schema';
import { categoryResolvers, categoryTypeDefs } from './category';
import { CollectionResolvers, CollectionTypeDefs } from './collection';
import { keywordResolvers, keywordTypeDefs } from './keyword';
import { userResolvers, userTypeDefs } from './user';

const schema = makeExecutableSchema({
    typeDefs: [
        categoryTypeDefs,
        CollectionTypeDefs,
        keywordTypeDefs,
        userTypeDefs,
    ],
    resolvers: [
        categoryResolvers,
        CollectionResolvers,
        keywordResolvers,
        userResolvers,
    ],
});

export default schema;
