/**
 * Tất cả Swagger Documentation được định nghĩa ở đây
 */

const swaggerDocs = {
  // Authentication APIs
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Đăng nhập',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  example: 'user@example.com'
                },
                password: {
                  type: 'string',
                  example: 'password123'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Đăng nhập thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  user: { type: 'object' }
                }
              }
            }
          }
        },
        401: {
          description: 'Sai email hoặc mật khẩu'
        }
      }
    }
  },

  '/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Đăng ký tài khoản mới',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: {
                  type: 'string',
                  example: 'newuser@example.com'
                },
                password: {
                  type: 'string',
                  example: 'password123'
                },
                name: {
                  type: 'string',
                  example: 'Nguyễn Văn A'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Đăng ký thành công'
        },
        400: {
          description: 'Email đã tồn tại'
        }
      }
    }
  },

  // Protected Route Example
  '/me': {
    get: {
      tags: ['User'],
      summary: 'Lấy thông tin người dùng hiện tại',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  user: { type: 'object' }
                }
              }
            }
          }
        },
        401: {
          description: 'Chưa đăng nhập'
        }
      }
    }
  }

  // Thêm các routes khác ở đây theo cùng format
};

module.exports = swaggerDocs;
