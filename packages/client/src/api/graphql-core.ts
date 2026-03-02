import axios from 'axios';

interface GraphQLError {
    message: string;
}

interface GraphQLResponse<T extends string, K> {
    data: {
        [key in T]: K;
    };
    errors?: GraphQLError[];
}

export const escapeGraphQLString = (value: string) => value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

export async function graphQLRequest<T extends string, K>(
    query: string,
    variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T, K>> {
    const { data } = await axios.request<GraphQLResponse<T, K>>({
        method: 'POST',
        url: '/graphql',
        data: variables ? { query, variables } : { query },
    });

    if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors.map((error: GraphQLError) => error.message).join('\n'));
    }

    return data;
}
