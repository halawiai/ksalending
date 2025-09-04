/**
 * OpenAPI/Swagger Documentation for KSA Lending Nervous System API
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'KSA Lending Nervous System API',
    version: '1.0.0',
    description: 'Central platform API for Saudi Arabia\'s lending ecosystem',
    contact: {
      name: 'KSA Lending Support',
      email: 'api-support@ksalending.sa',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://api.ksalending.sa/v1',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.ksalending.sa/v1',
      description: 'Staging server',
    },
  ],
  paths: {
    '/auth/token': {
      post: {
        tags: ['Authentication'],
        summary: 'Generate access token',
        description: 'Authenticate using API key and secret to receive JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['api_key', 'api_secret'],
                properties: {
                  api_key: {
                    type: 'string',
                    description: 'Partner API key',
                    minLength: 32,
                  },
                  api_secret: {
                    type: 'string',
                    description: 'Partner API secret',
                    minLength: 32,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    access_token: { type: 'string' },
                    token_type: { type: 'string', example: 'Bearer' },
                    expires_in: { type: 'number', example: 3600 },
                    partner_id: { type: 'string' },
                    partner_name: { type: 'string' },
                    rate_limit: {
                      type: 'object',
                      properties: {
                        requests_per_hour: { type: 'number' },
                        remaining: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Refresh an expired or soon-to-expire JWT token',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    access_token: { type: 'string' },
                    token_type: { type: 'string', example: 'Bearer' },
                    expires_in: { type: 'number', example: 3600 },
                    partner_id: { type: 'string' },
                    partner_name: { type: 'string' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/assessments': {
      post: {
        tags: ['Assessments'],
        summary: 'Request credit assessment',
        description: 'Submit a credit assessment request for an entity',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssessmentRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Assessment completed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AssessmentResponse' },
              },
            },
          },
          400: {
            description: 'Invalid request format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Assessments'],
        summary: 'List assessments',
        description: 'Retrieve a list of assessments with optional filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'entity_id',
            in: 'query',
            description: 'Filter by entity ID',
            schema: { type: 'string' },
          },
          {
            name: 'entity_type',
            in: 'query',
            description: 'Filter by entity type',
            schema: {
              type: 'string',
              enum: ['individual', 'company', 'institution'],
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return (max 100)',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
        ],
        responses: {
          200: {
            description: 'Assessments retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assessments: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AssessmentSummary' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/assessments/{id}': {
      get: {
        tags: ['Assessments'],
        summary: 'Get assessment details',
        description: 'Retrieve detailed information about a specific assessment',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Assessment ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Assessment details retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AssessmentDetails' },
              },
            },
          },
          404: {
            description: 'Assessment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/entities': {
      post: {
        tags: ['Entities'],
        summary: 'Create entity',
        description: 'Create a new entity in the system',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateEntityRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Entity created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EntityResponse' },
              },
            },
          },
          409: {
            description: 'Entity already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Entities'],
        summary: 'List entities',
        description: 'Retrieve a list of entities',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'entity_type',
            in: 'query',
            description: 'Filter by entity type',
            schema: {
              type: 'string',
              enum: ['individual', 'company', 'institution'],
            },
          },
          {
            name: 'identification_type',
            in: 'query',
            description: 'Filter by identification type',
            schema: {
              type: 'string',
              enum: ['national_id', 'commercial_reg', 'license_number'],
            },
          },
          {
            name: 'identification_number',
            in: 'query',
            description: 'Filter by identification number',
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return (max 100)',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
        ],
        responses: {
          200: {
            description: 'Entities retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    entities: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/EntitySummary' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/entities/{id}': {
      get: {
        tags: ['Entities'],
        summary: 'Get entity details',
        description: 'Retrieve detailed information about a specific entity',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Entity ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Entity details retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EntityDetails' },
              },
            },
          },
          404: {
            description: 'Entity not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Entities'],
        summary: 'Update entity',
        description: 'Update entity information',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Entity ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateEntityRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Entity updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    entity_id: { type: 'string' },
                    message: { type: 'string' },
                    updated_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Entity not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'array', items: { type: 'string' } },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      AssessmentRequest: {
        type: 'object',
        required: ['entity_type', 'identification'],
        properties: {
          entity_type: {
            type: 'string',
            enum: ['individual', 'company', 'institution'],
          },
          identification: {
            type: 'object',
            required: ['type', 'number'],
            properties: {
              type: {
                type: 'string',
                enum: ['national_id', 'commercial_reg', 'license_number'],
              },
              number: { type: 'string', minLength: 8 },
            },
          },
          loan_details: {
            type: 'object',
            properties: {
              amount: { type: 'number', minimum: 1000 },
              purpose: { type: 'string', minLength: 2 },
              tenure_months: { type: 'number', minimum: 6, maximum: 120 },
            },
          },
          include_alternative_data: { type: 'boolean', default: true },
          include_fraud_check: { type: 'boolean', default: true },
        },
      },
      AssessmentResponse: {
        type: 'object',
        properties: {
          assessment_id: { type: 'string' },
          entity_id: { type: 'string' },
          credit_score: { type: 'number', minimum: 350, maximum: 850 },
          risk_category: { type: 'string' },
          decision: {
            type: 'string',
            enum: ['approved', 'conditional', 'declined'],
          },
          approved_amount: { type: 'number' },
          max_amount: { type: 'number' },
          interest_rate: { type: 'number' },
          interest_rate_range: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
            },
          },
          probability_of_default: { type: 'number' },
          processing_time_ms: { type: 'number' },
          factors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                impact: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                weight: { type: 'number' },
                description: { type: 'string' },
              },
            },
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' },
          },
          fraud_check: {
            type: 'object',
            properties: {
              risk_score: { type: 'number' },
              flags: { type: 'array', items: { type: 'string' } },
              recommendation: {
                type: 'string',
                enum: ['approve', 'review', 'reject'],
              },
            },
          },
          expires_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AssessmentSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          entity_id: { type: 'string' },
          entity_type: { type: 'string' },
          credit_score: { type: 'number' },
          risk_level: { type: 'string' },
          assessment_type: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AssessmentDetails: {
        type: 'object',
        properties: {
          assessment_id: { type: 'string' },
          entity_id: { type: 'string' },
          entity_type: { type: 'string' },
          credit_score: { type: 'number' },
          risk_level: { type: 'string' },
          assessment_type: { type: 'string' },
          factors: { type: 'array', items: { type: 'object' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          created_at: { type: 'string', format: 'date-time' },
          entity: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              verification_status: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      CreateEntityRequest: {
        type: 'object',
        required: ['entity_type', 'identification', 'profile_data'],
        properties: {
          entity_type: {
            type: 'string',
            enum: ['individual', 'company', 'institution'],
          },
          identification: {
            type: 'object',
            required: ['type', 'number'],
            properties: {
              type: {
                type: 'string',
                enum: ['national_id', 'commercial_reg', 'license_number'],
              },
              number: { type: 'string', minLength: 8 },
            },
          },
          profile_data: {
            type: 'object',
            properties: {
              // Individual fields
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              date_of_birth: { type: 'string', format: 'date' },
              nationality: { type: 'string' },
              phone_number: { type: 'string' },
              email: { type: 'string', format: 'email' },
              monthly_income: { type: 'number' },
              employment_status: {
                type: 'string',
                enum: ['employed', 'self_employed', 'unemployed', 'retired'],
              },
              // Company fields
              company_name: { type: 'string' },
              legal_form: {
                type: 'string',
                enum: ['llc', 'joint_stock', 'partnership', 'sole_proprietorship'],
              },
              establishment_date: { type: 'string', format: 'date' },
              industry_sector: { type: 'string' },
              annual_revenue: { type: 'number' },
              employee_count: { type: 'number' },
              // Institution fields
              institution_name: { type: 'string' },
              institution_type: {
                type: 'string',
                enum: ['bank', 'finance_company', 'microfinance', 'cooperative'],
              },
              regulatory_authority: {
                type: 'string',
                enum: ['sama', 'cma', 'other'],
              },
              capital_adequacy_ratio: { type: 'number' },
            },
          },
        },
      },
      UpdateEntityRequest: {
        type: 'object',
        properties: {
          profile_data: {
            type: 'object',
            // Same properties as CreateEntityRequest.profile_data but all optional
          },
          verification_status: {
            type: 'string',
            enum: ['pending', 'verified', 'rejected'],
          },
        },
      },
      EntityResponse: {
        type: 'object',
        properties: {
          entity_id: { type: 'string' },
          entity_type: { type: 'string' },
          verification_status: { type: 'string' },
          identification: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              number: { type: 'string' },
              verified: { type: 'boolean' },
            },
          },
          created_at: { type: 'string', format: 'date-time' },
          created_by: { type: 'string' },
        },
      },
      EntitySummary: {
        type: 'object',
        properties: {
          entity_id: { type: 'string' },
          entity_type: { type: 'string' },
          verification_status: { type: 'string' },
          identification: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              number: { type: 'string' },
              verified: { type: 'boolean' },
            },
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      EntityDetails: {
        type: 'object',
        properties: {
          entity_id: { type: 'string' },
          entity_type: { type: 'string' },
          verification_status: { type: 'string' },
          identification: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              number: { type: 'string' },
              verified: { type: 'boolean' },
              verification_date: { type: 'string', format: 'date-time' },
            },
          },
          profile: { type: 'object' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          offset: { type: 'number' },
          total: { type: 'number' },
        },
      },
    },
  },
};