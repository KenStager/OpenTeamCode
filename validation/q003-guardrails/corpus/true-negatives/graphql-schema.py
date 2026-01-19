# GraphQL schema definitions - NOT secrets
SCHEMA = """
type User {
    id: ID!
    email: String!
    name: String
    createdAt: DateTime!
}

type Query {
    user(id: ID!): User
    users(limit: Int, offset: Int): [User!]!
}

type Mutation {
    createUser(email: String!, password: String!): User!
    updateUser(id: ID!, name: String): User!
    deleteUser(id: ID!): Boolean!
}

input UserInput {
    email: String!
    password: String!
    name: String
}

type AuthPayload {
    token: String!
    user: User!
}
"""

QUERY_DEPTH_LIMIT = 10
QUERY_COMPLEXITY_LIMIT = 1000
