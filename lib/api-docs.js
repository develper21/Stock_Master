import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StockMaster API',
      version: '1.0.0',
      description: 'Enterprise-Grade Multi-Warehouse Inventory Management System API',
      contact: {
        name: 'API Support',
        email: 'support@stockmaster.com',
        url: 'https://stockmaster.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.stockmaster.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'loginId', 'password'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            fullName: {
              type: 'string',
              description: 'User full name',
            },
            loginId: {
              type: 'string',
              description: 'Unique login identifier',
            },
            role: {
              type: 'string',
              enum: ['warehouse_staff', 'inventory_manager'],
              description: 'User role',
            },
            defaultWarehouseId: {
              type: 'string',
              format: 'uuid',
              description: 'Default warehouse ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Product: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Product unique identifier',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            code: {
              type: 'string',
              description: 'Product code/SKU',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              description: 'Category ID',
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement',
            },
            minStockLevel: {
              type: 'integer',
              description: 'Minimum stock level',
            },
            maxStockLevel: {
              type: 'integer',
              description: 'Maximum stock level',
            },
            reorderPoint: {
              type: 'integer',
              description: 'Reorder point',
            },
            costPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Cost price',
            },
            sellingPrice: {
              type: 'number',
              format: 'decimal',
              description: 'Selling price',
            },
            isActive: {
              type: 'boolean',
              description: 'Product active status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Warehouse: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Warehouse unique identifier',
            },
            name: {
              type: 'string',
              description: 'Warehouse name',
            },
            code: {
              type: 'string',
              description: 'Warehouse code',
            },
            address: {
              type: 'string',
              description: 'Warehouse address',
            },
            city: {
              type: 'string',
              description: 'City',
            },
            state: {
              type: 'string',
              description: 'State',
            },
            country: {
              type: 'string',
              description: 'Country',
            },
            postalCode: {
              type: 'string',
              description: 'Postal code',
            },
            phone: {
              type: 'string',
              description: 'Phone number',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            isActive: {
              type: 'boolean',
              description: 'Warehouse active status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        StockLevel: {
          type: 'object',
          required: ['productId', 'warehouseId', 'quantity'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Stock level unique identifier',
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'Product ID',
            },
            warehouseId: {
              type: 'string',
              format: 'uuid',
              description: 'Warehouse ID',
            },
            locationId: {
              type: 'string',
              format: 'uuid',
              description: 'Location ID',
            },
            quantity: {
              type: 'integer',
              description: 'Total quantity',
            },
            reservedQuantity: {
              type: 'integer',
              description: 'Reserved quantity',
            },
            availableQuantity: {
              type: 'integer',
              description: 'Available quantity',
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Receipt: {
          type: 'object',
          required: ['receiptNumber', 'supplierId', 'warehouseId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Receipt unique identifier',
            },
            receiptNumber: {
              type: 'string',
              description: 'Receipt number',
            },
            supplierId: {
              type: 'string',
              format: 'uuid',
              description: 'Supplier ID',
            },
            warehouseId: {
              type: 'string',
              format: 'uuid',
              description: 'Warehouse ID',
            },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'validated', 'cancelled'],
              description: 'Receipt status',
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Total amount',
            },
            receivedDate: {
              type: 'string',
              format: 'date',
              description: 'Received date',
            },
            receivedBy: {
              type: 'string',
              format: 'uuid',
              description: 'Received by user ID',
            },
            notes: {
              type: 'string',
              description: 'Notes',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Error details',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Success status',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './app/api/**/*.js',
    './app/api/**/*.jsx',
    './app/api/**/*.ts',
    './app/api/**/*.tsx',
  ],
};

export const specs = swaggerJsdoc(options);

export default specs;
