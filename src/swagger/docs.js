/**
 * Tất cả Swagger Documentation được định nghĩa ở đây
 */

const swaggerDocs = {
  // Authentication APIs
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
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
                  example: 'hocsinh@gmai.com'
                },
                password: {
                  type: 'string',
                  example: '123456'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  user: {
                    'user_id': { type: 'string' },
                    'email': { type: 'string' },
                    'name': { type: 'string' },
                   }
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
      summary: 'Resgister a new user',
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
  // '/me': {
  //   get: {
  //     tags: ['User'],
  //     summary: 'Lấy thông tin người dùng hiện tại',
  //     security: [{ bearerAuth: [] }],
  //     responses: {
  //       200: {
  //         description: 'Thành công',
  //         content: {
  //           'application/json': {
  //             schema: {
  //               type: 'object',
  //               properties: {
  //                 message: { type: 'string' },
  //                 user: { type: 'object' }
  //               }
  //             }
  //           }
  //         }
  //       },
  //       401: {
  //         description: 'Chưa đăng nhập'
  //       }
  //     }
  //   }
  // },

  // Thêm các routes khác ở đây theo cùng format
  '/users/profile':{
    get:{
      tags: ['User'],
      summary: 'Get personal profile information',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone_numbder: { type: 'string' },
                  code: { type: 'string' },
                  is_deleted: {
                    type: 'buffer',
                    data:{
                      type: 'boolean'
                    }
                  },
                  is_auth2:{
                    type: 'buffer',
                    data:{
                      type: 'boolean'
                    }
                  },
                  created_by: { type: 'string' },
                  created_date: { type: 'string', format: 'date-time' },
                  modified_by: { type: 'string' },
                  modified_date: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized'
        },
        404: {
          description: 'User not found'
        },
        500: {
          description: 'Internal server error'
        }
      }
    },
    put:{
      tags: ['User'],
      summary: "Update personal profile information",
      security: [{ bearerAuth: [] }],
      requestBody:{
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Nguyễn Văn B' },
                email: { type: 'string', example: 'newemail@example.com' },
                phone_numbder: { type: 'string', example: '0123456789' },
                gender: { type: 'string', example: 'Male' },
                address: { type: 'string', example: '123 Đường ABC, Quận 1, TP.HCM' },
                avatar_location: { type: 'string', example: '/images/avatar.jpg' },
                birth_day: { type: 'string', format: 'date', example: '1990-01-01' },
                code: { type: 'string', example: 'ADMIN' },
                school_id: { type: 'string', example: 'SCHOOL001' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized'
        }
      }
    }
  },

  '/organizations': {
    get: {
      tags: ['Organization'],
      summary: 'Get list of organizations',
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    organization_id: { type: 'string' },
                    parent_id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string' },
                    status: { type: 'string' },
                    created_by: { type: 'string' },
                    created_date: { type: 'string', format: 'date-time' },
                    modified_by: { type: 'string' },
                    modified_date: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal server error'
        }
      }
    },
   get:{
      tags: ['Organization'],
      summary: 'Get information of an organization by ID',
      parameters: [
        {
          name: 'organization_id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'ID of the organization to retrieve'
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  organization_id: { type: 'string' },
                  parent_id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  status: { type: 'string' },
                  created_by: { type: 'string' },
                  created_date: { type: 'string', format: 'date-time' },
                  modified_by: { type: 'string' },
                  modified_date: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        404: {
          description: 'Organization not found'
        },
        500: {
          description: 'Internal server error'
        }
      }
   },

   post: {
      tags: ['Organization'],
      summary: 'Create a new organization',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'type'],
              properties: {
                parent_id: { type: 'string', example: 'null - Bộ Giáo dục, 1 - Sở Giáo dục, 2 - Trường' },
                name: { type: 'string', example: 'Trường THPT Nguyễn Huệ' },
                type: { type: 'string', example: 'SCHOOL' },
                address: { type: 'string', example: 'Số 12 Đường Nguyễn Huệ' },
                city: { type: 'string', example: 'Thành phố Hà Nội' },
                ward: { type: 'string', example: 'Quận Hoàn Kiếm' },
                street: { type: 'string', example: 'Đường Nguyễn Huệ' },
                phone: { type: 'string', example: '024 3825 6789' },
                email: { type: 'string', example: 'thptnguyenhue@edu.vn' }
              }
            }
          }
        }
      }
    },
      responses: {
        201: {
          description: 'Organization created successfully'
        },
        400: {
          description: 'Bad request - missing required fields or invalid parent ID'
        },
        500: {
          description: 'Internal server error'
        }
      },
    put: {
      tags: ['Organization'],
      summary: 'Update an existing organization',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'ID of the organization to update'
        }
      ],
      requestBody: {
        required: true,
        description: 'Can update any of the organization fields',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                parent_id: { type: 'string', example: 'null - Bộ Giáo dục, 1 - Sở Giáo dục, 2 - Trường' },
                name: { type: 'string', example: 'Trường THPT Nguyễn Huệ' },
                type: { type: 'string', example: 'SCHOOL' },
                address: { type: 'string', example: 'Số 12 Đường Nguyễn Huệ' },
                city: { type: 'string', example: 'Thành phố Hà Nội' },
                ward: { type: 'string', example: 'Quận Hoàn Kiếm' },
                street: { type: 'string', example: 'Đường Nguyễn Huệ' },
                phone: { type: 'string', example: '024 3825 6789' },
                email: { type: 'string', example: 'thptnguyenhue@edu.vn' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Organization updated successfully'
        },
        400: {
          description: 'Bad request - invalid parent ID'
        },
        404: {
          description: 'Organization not found'
        },
        500: {
          description: 'Internal server error'
        }
      }
    },
    delete: {
      tags: ['Organization'],
      summary: 'Delete an organization',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'ID of the organization to delete'
        }
      ],
      responses: {
        200: {
          description: 'Organization deleted successfully'
        },
        404: {
          description: 'Organization not found'
        },
        500: {
          description: 'Internal server error'
        }
      }
    }
  },

  '/organization-managers':{
    post:{
      tags: ['Organization Manager Assignment'],
      summary: 'Assign organization management role to a user',
      security: [{ bearerAuth: [] }],
      description: 'Is_primary: Nếu true thì user này sẽ là quản lý chính của tổ chức, các quản lý khác sẽ bị hạ xuống không phải quản lý chính nữa.',
      requestBody:{
        required: true,
        content:{
          'application/json':{
            schema:{
              type: 'object',
              required: ['organization_id', 'user_id', 'role_in_org'],
              properties:{
                organization_id: { type: 'string', example: '123' },
                user_id: { type: 'string', example: '456' },
                role_in_org: { type: 'string', example: 'SUPER_ADMIN', enum: ['SUPER_ADMIN','CENTER_ADMIN','SCHOOL_ADMIN','TEACHER','STUDENT'] },
                is_primary: { type: 'boolean', example: true }
              }
            }
          }
        }
      },
      responses:{
        201:{
          description: 'Role assigned successfully'
        },
        400:{
          description: 'Missing required fields'
        },
        409:{
          description: 'Conflict: User already has a role in this organization'
        },
        500:{
          description: 'Internal server error'
        }
      }
    },
    delete:{
      tags: ['Organization Manager Assignment'],
      summary: 'Revoke organization management role from a user',
      security: [{ bearerAuth: [] }],
      requestBody:{
        required: true,
        content:{
          'application/json':{
            schema:{
              type: 'object',
              required: ['organization_id', 'user_id'],
              properties:{
                organization_id: { type: 'string', example: '12' },
                user_id: { type: 'string', example: '34' }
              }
            }
          }
        }
      },
      responses:{
        200:{
          description: 'Role revoked successfully'
        },
        400:{
          description: 'Missing required fields'
        },
        404:{
          description: 'Not Found: No such role assignment'
        },
        500:{
          description: 'Internal server error'
        }
      }
    }
  }
};

module.exports = swaggerDocs;
