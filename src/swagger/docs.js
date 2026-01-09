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
                    type: 'object',
                    properties: {
                      user_id: { type: 'string' },
                      email: { type: 'string' },
                      name: { type: 'string' }
                    }
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

  '/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Request password reset',
      description: 'Gửi email chứa link đặt lại mật khẩu đến email người dùng',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'user@example.com',
                  description: 'Email đã đăng ký trong hệ thống'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Yêu cầu đặt lại mật khẩu đã được xử lý',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Email không hợp lệ'
        },
        500: {
          description: 'Lỗi server'
        }
      }
    }
  },

  '/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset password with token',
      description: 'Đặt lại mật khẩu mới sử dụng token từ email',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'newPassword'],
              properties: {
                token: {
                  type: 'string',
                  example: 'abc123def456ghi789...',
                  description: 'Token nhận được từ email reset password'
                },
                newPassword: {
                  type: 'string',
                  minLength: 6,
                  example: 'newPassword123',
                  description: 'Mật khẩu mới (tối thiểu 6 ký tự)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Đặt lại mật khẩu thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Token không hợp lệ hoặc đã hết hạn'
        },
        500: {
          description: 'Lỗi server'
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
                  phone_number: { type: 'string' },
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
                phone_number: { type: 'string', example: '0123456789' },
                gender: { type: 'string', example: 'Male' },
                address: { type: 'string', example: '123 Đường ABC, Phường 1, TP.HCM' },
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

  '/users/change-password': {
    put: {
      tags: ['User'],
      summary: 'Change user password',
      description: 'Đổi mật khẩu người dùng (yêu cầu đăng nhập)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword', 'confirmPassword'],
              properties: {
                currentPassword: {
                  type: 'string',
                  example: 'oldPassword123',
                  description: 'Mật khẩu hiện tại'
                },
                newPassword: {
                  type: 'string',
                  minLength: 6,
                  example: 'newPassword456',
                  description: 'Mật khẩu mới (tối thiểu 6 ký tự)'
                },
                confirmPassword: {
                  type: 'string',
                  example: 'newPassword456',
                  description: 'Xác nhận mật khẩu mới'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Đổi mật khẩu thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Đổi mật khẩu thành công'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Mật khẩu không hợp lệ hoặc không khớp'
        },
        401: {
          description: 'Chưa đăng nhập'
        },
        500: {
          description: 'Lỗi server'
        }
      }
    }
  },

  '/users/avatar/upload': {
    post: {
      tags: ['User'],
      summary: 'Upload user avatar (file)',
      description: 'Upload file ảnh làm avatar (multipart/form-data)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['avatar'],
              properties: {
                avatar: {
                  type: 'string',
                  format: 'binary',
                  description: 'File ảnh (JPEG, PNG, GIF, WEBP - tối đa 5MB)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Upload avatar thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Upload avatar thành công'
                  },
                  avatar_location: {
                    type: 'string',
                    example: '/uploads/avatars/1_1234567890_avatar.jpg'
                  },
                  file_info: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string', example: '1_1234567890_avatar.jpg' },
                      size: { type: 'number', example: 153240 },
                      mimetype: { type: 'string', example: 'image/jpeg' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'File không hợp lệ hoặc quá lớn'
        },
        401: {
          description: 'Chưa đăng nhập'
        },
        500: {
          description: 'Lỗi server'
        }
      }
    }
  },

  '/users/avatar/url': {
    put: {
      tags: ['User'],
      summary: 'Update avatar by URL',
      description: 'Cập nhật avatar bằng URL (cho Cloudinary, S3, etc.)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['avatar_location'],
              properties: {
                avatar_location: {
                  type: 'string',
                  example: 'https://cloudinary.com/avatars/user123.jpg',
                  description: 'URL đến file avatar'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cập nhật avatar thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Cập nhật avatar thành công'
                  },
                  avatar_location: {
                    type: 'string',
                    example: 'https://cloudinary.com/avatars/user123.jpg'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Thiếu thông tin avatar_location'
        },
        401: {
          description: 'Chưa đăng nhập'
        },
        500: {
          description: 'Lỗi server'
        }
      }
    }
  },

  '/users/account': {
    delete: {
      tags: ['User'],
      summary: 'Delete user account',
      description: 'Xóa tài khoản người dùng (soft delete)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password', 'confirmDelete'],
              properties: {
                password: {
                  type: 'string',
                  example: 'myPassword123',
                  description: 'Mật khẩu để xác nhận xóa tài khoản'
                },
                confirmDelete: {
                  type: 'boolean',
                  example: true,
                  description: 'Xác nhận muốn xóa tài khoản (phải là true)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Xóa tài khoản thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Xóa tài khoản thành công. Tài khoản của bạn đã bị vô hiệu hóa.'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Mật khẩu không đúng hoặc chưa xác nhận xóa'
        },
        401: {
          description: 'Chưa đăng nhập'
        },
        404: {
          description: 'Không tìm thấy người dùng'
        },
        500: {
          description: 'Lỗi server'
        }
      }
    }
  },

  '/users/activity-log': {
    get: {
      tags: ['User'],
      summary: 'Get user activity log',
      description: 'Lấy lịch sử hoạt động của người dùng',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user_info: {
                    type: 'object',
                    properties: {
                      user_id: { type: 'string' },
                      email: { type: 'string' },
                      name: { type: 'string' },
                      account_created: { type: 'string', format: 'date-time' },
                      last_modified: { type: 'string', format: 'date-time' },
                      last_modified_by: { type: 'string' },
                      is_oauth2: { type: 'number' },
                      role: { type: 'string' }
                    }
                  },
                  activity_summary: {
                    type: 'object',
                    properties: {
                      account_created: { type: 'string', format: 'date-time' },
                      last_login: { type: 'string' },
                      last_profile_update: { type: 'string', format: 'date-time' },
                      last_modified_by: { type: 'string' }
                    }
                  },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        401: {
          description: 'Chưa đăng nhập'
        },
        404: {
          description: 'Không tìm thấy người dùng'
        },
        500: {
          description: 'Lỗi server'
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
                ward: { type: 'string', example: 'Phường Hoàn Kiếm' },
                street: { type: 'string', example: 'Đường Nguyễn Huệ' },
                phone: { type: 'string', example: '024 3825 6789' },
                email: { type: 'string', example: 'thptnguyenhue@edu.vn' }
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
      }
    }
  },

  '/organizations/{id}': {
    get: {
      tags: ['Organization'],
      summary: 'Get information of an organization by ID',
      parameters: [
        {
          name: 'id',
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
                ward: { type: 'string', example: 'Phường Hoàn Kiếm' },
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

  // Permission Management APIs
  '/api/permissions': {
    get: {
      tags: ['Permission Management'],
      summary: 'Get all permissions',
      description: 'Lấy danh sách tất cả các quyền trong hệ thống (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'module',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'USER'
          },
          description: 'Lọc theo module (USER, ORGANIZATION, CLASS, COURSE, SYSTEM)'
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
                  total: { type: 'number', example: 20 },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        permission_id: { type: 'number' },
                        code: { type: 'string', example: 'USER_CREATE' },
                        name: { type: 'string', example: 'Tạo người dùng' },
                        description: { type: 'string', example: 'Tạo người dùng mới' },
                        module: { type: 'string', example: 'USER' },
                        created_date: { type: 'string', format: 'date-time' }
                      }
                    }
                  },
                  grouped: {
                    type: 'object',
                    description: 'Permissions nhóm theo module'
                  }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền truy cập' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/permissions/my': {
    get: {
      tags: ['Permission Management'],
      summary: 'Get my permissions',
      description: 'Lấy danh sách quyền của người dùng hiện tại',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'organization_id',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID tổ chức (để lấy quyền theo tổ chức cụ thể)'
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
                  user_id: { type: 'number' },
                  organization_id: { type: 'string', example: 'global' },
                  total: { type: 'number', example: 5 },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'CLASS_VIEW' },
                        name: { type: 'string', example: 'Xem lớp học' },
                        description: { type: 'string' },
                        module: { type: 'string', example: 'CLASS' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/permissions/user/{userId}': {
    get: {
      tags: ['Permission Management'],
      summary: 'Get user permissions by ID',
      description: 'Lấy danh sách quyền của user khác (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID của user cần xem quyền'
        },
        {
          name: 'organization_id',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID tổ chức'
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
                  user_id: { type: 'string' },
                  organization_id: { type: 'string' },
                  total: { type: 'number' },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        module: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền truy cập' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/permissions/grant': {
    post: {
      tags: ['Permission Management'],
      summary: 'Grant permission to user',
      description: 'Cấp quyền cho người dùng (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['user_id', 'permission_code'],
              properties: {
                user_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID người dùng cần cấp quyền'
                },
                permission_code: {
                  type: 'string',
                  example: 'CLASS_CREATE',
                  description: 'Mã quyền cần cấp'
                },
                organization_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID tổ chức (null = quyền global)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cấp quyền thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Cấp quyền thành công' },
                  user_id: { type: 'number' },
                  permission_code: { type: 'string' },
                  organization_id: { type: 'string' }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin user_id hoặc permission_code' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền truy cập' },
        404: { description: 'Không tìm thấy người dùng hoặc quyền không tồn tại' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/permissions/revoke': {
    post: {
      tags: ['Permission Management'],
      summary: 'Revoke permission from user',
      description: 'Thu hồi quyền của người dùng (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['user_id', 'permission_code'],
              properties: {
                user_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID người dùng cần thu hồi quyền'
                },
                permission_code: {
                  type: 'string',
                  example: 'CLASS_CREATE',
                  description: 'Mã quyền cần thu hồi'
                },
                organization_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID tổ chức'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Thu hồi quyền thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Thu hồi quyền thành công' },
                  user_id: { type: 'number' },
                  permission_code: { type: 'string' },
                  organization_id: { type: 'string' }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin user_id hoặc permission_code' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền truy cập' },
        404: { description: 'Không tìm thấy quyền để thu hồi' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/roles/{roleCode}/permissions': {
    get: {
      tags: ['Permission Management'],
      summary: 'Get role permissions',
      description: 'Lấy danh sách quyền của role (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'roleCode',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'TEACHER'
          },
          description: 'Mã role (ADMIN, TEACHER, STUDENT)'
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
                  role_code: { type: 'string', example: 'TEACHER' },
                  total: { type: 'number', example: 8 },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        permission_id: { type: 'number' },
                        code: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        module: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền truy cập' },
        500: { description: 'Lỗi server' }
      }
    },
    post: {
      tags: ['Permission Management'],
      summary: 'Add permission to role',
      description: 'Thêm quyền cho role (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'roleCode',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'TEACHER'
          },
          description: 'Mã role cần thêm quyền'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['permission_code'],
              properties: {
                permission_code: {
                  type: 'string',
                  example: 'COURSE_DELETE',
                  description: 'Mã quyền cần thêm cho role'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Thêm quyền cho role thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Thêm quyền cho role thành công' },
                  role_code: { type: 'string' },
                  permission_code: { type: 'string' }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin permission_code' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền truy cập' },
        404: { description: 'Role không tồn tại' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/roles/{roleCode}/permissions/{permissionCode}': {
    delete: {
      tags: ['Permission Management'],
      summary: 'Remove permission from role',
      description: 'Xóa quyền khỏi role (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'roleCode',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'TEACHER'
          },
          description: 'Mã role'
        },
        {
          name: 'permissionCode',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'COURSE_DELETE'
          },
          description: 'Mã quyền cần xóa'
        }
      ],
      responses: {
        200: {
          description: 'Xóa quyền khỏi role thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Xóa quyền khỏi role thành công' },
                  role_code: { type: 'string' },
                  permission_code: { type: 'string' }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền truy cập' },
        404: { description: 'Không tìm thấy quyền để xóa' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  // Organization Role Management APIs
  '/org-roles/my-organizations': {
    get: {
      tags: ['Organization Role Management'],
      summary: 'Get my organizations',
      description: 'Lấy tất cả tổ chức mà user đã đăng nhập tham gia',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user_id: { type: 'number', example: 1 },
                  total_organizations: { type: 'number', example: 3 },
                  organizations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        organization_id: { type: 'number', example: 1 },
                        organization_name: { type: 'string', example: 'Trường THPT ABC' },
                        role_in_org: {
                          type: 'string',
                          example: 'TEACHER',
                          enum: ['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'USER']
                        },
                        is_primary: { type: 'number', example: 1, description: '1 = tổ chức chính, 0 = không' },
                        assigned_date: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/org-roles/assign': {
    post: {
      tags: ['Organization Role Management'],
      summary: 'Assign organization role to user',
      description: 'Gán vai trò tổ chức cho user (yêu cầu CENTER_ADMIN trở lên)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organization_id', 'user_id', 'role_in_org'],
              properties: {
                organization_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID tổ chức'
                },
                user_id: {
                  type: 'number',
                  example: 5,
                  description: 'ID người dùng cần gán vai trò'
                },
                role_in_org: {
                  type: 'string',
                  enum: ['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'USER'],
                  example: 'TEACHER',
                  description: 'Vai trò trong tổ chức'
                },
                is_primary: {
                  type: 'boolean',
                  example: false,
                  description: 'Đặt làm tổ chức chính của user (mặc định: false)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Gán vai trò thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Gán vai trò thành công' },
                  data: {
                    type: 'object',
                    properties: {
                      user_id: { type: 'number' },
                      organization_id: { type: 'number' },
                      role_in_org: { type: 'string' },
                      is_primary: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin bắt buộc' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền gán vai trò này' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/org-roles/remove': {
    delete: {
      tags: ['Organization Role Management'],
      summary: 'Remove organization role from user',
      description: 'Xóa vai trò tổ chức của user (yêu cầu CENTER_ADMIN trở lên)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organization_id', 'user_id'],
              properties: {
                organization_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID tổ chức'
                },
                user_id: {
                  type: 'number',
                  example: 5,
                  description: 'ID người dùng cần xóa vai trò'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Xóa vai trò thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Xóa vai trò thành công' },
                  user_id: { type: 'number' },
                  organization_id: { type: 'number' }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin bắt buộc' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền xóa vai trò' },
        404: { description: 'Không tìm thấy vai trò' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/org-roles/organization/{organizationId}/users': {
    get: {
      tags: ['Organization Role Management'],
      summary: 'Get all users in organization',
      description: 'Lấy tất cả users trong tổ chức với vai trò',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'organizationId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID tổ chức'
        },
        {
          name: 'role_in_org',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'CENTER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'USER'],
            example: 'TEACHER'
          },
          description: 'Lọc theo vai trò'
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
                  organization_id: { type: 'number' },
                  total_users: { type: 'number', example: 15 },
                  users: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        user_id: { type: 'number' },
                        name: { type: 'string', example: 'Nguyễn Văn A' },
                        email: { type: 'string', example: 'nguyenvana@example.com' },
                        role_in_org: { type: 'string', example: 'TEACHER' },
                        is_primary: { type: 'number', example: 1 },
                        assigned_date: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu organization_id' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không thuộc tổ chức này' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/org-roles/user/{userId}/primary-organization': {
    get: {
      tags: ['Organization Role Management'],
      summary: 'Get user primary organization',
      description: 'Lấy tổ chức chính của user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng'
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
                  user_id: { type: 'number' },
                  primary_organization: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      organization_id: { type: 'number' },
                      organization_name: { type: 'string' },
                      role_in_org: { type: 'string' },
                      assigned_date: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        404: { description: 'User không có tổ chức chính' },
        500: { description: 'Lỗi server' }
      }
    },
    put: {
      tags: ['Organization Role Management'],
      summary: 'Set user primary organization',
      description: 'Đặt tổ chức chính cho user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organization_id'],
              properties: {
                organization_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID tổ chức muốn đặt làm chính'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Đặt tổ chức chính thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Đặt tổ chức chính thành công' },
                  user_id: { type: 'number' },
                  primary_organization_id: { type: 'number' }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu organization_id' },
        401: { description: 'Chưa đăng nhập' },
        404: { description: 'User không thuộc tổ chức này' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/org-roles/organization/{organizationId}/stats': {
    get: {
      tags: ['Organization Role Management'],
      summary: 'Get organization role statistics',
      description: 'Thống kê vai trò trong tổ chức',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'organizationId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID tổ chức'
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
                  organization_id: { type: 'number' },
                  total_users: { type: 'number', example: 50 },
                  role_distribution: {
                    type: 'object',
                    properties: {
                      SUPER_ADMIN: { type: 'number', example: 1 },
                      CENTER_ADMIN: { type: 'number', example: 2 },
                      SCHOOL_ADMIN: { type: 'number', example: 5 },
                      TEACHER: { type: 'number', example: 20 },
                      STUDENT: { type: 'number', example: 20 },
                      USER: { type: 'number', example: 2 }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu organization_id' },
        401: { description: 'Chưa đăng nhập' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/org-roles/check-role': {
    post: {
      tags: ['Organization Role Management'],
      summary: 'Check user role in organization',
      description: 'Kiểm tra vai trò của user trong tổ chức',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['organization_id', 'user_id'],
              properties: {
                organization_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID tổ chức'
                },
                user_id: {
                  type: 'number',
                  example: 5,
                  description: 'ID người dùng'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user_id: { type: 'number' },
                  organization_id: { type: 'number' },
                  has_role: { type: 'boolean', example: true },
                  role_in_org: { type: 'string', example: 'TEACHER' },
                  is_primary: { type: 'number', example: 1 }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin bắt buộc' },
        401: { description: 'Chưa đăng nhập' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  // User Management APIs (Admin)
  '/users/all': {
    get: {
      tags: ['User Management (Admin)'],
      summary: 'Get all users (Admin only)',
      description: 'Lấy danh sách tất cả người dùng với phân trang, tìm kiếm và lọc (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            example: 1,
            default: 1
          },
          description: 'Số trang hiện tại'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'number',
            example: 20,
            default: 20
          },
          description: 'Số lượng user mỗi trang'
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'nguyen'
          },
          description: 'Tìm kiếm theo tên hoặc email'
        },
        {
          name: 'role',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['ADMIN', 'TEACHER', 'STUDENT'],
            example: 'TEACHER'
          },
          description: 'Lọc theo role'
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'deleted'],
            example: 'active'
          },
          description: 'Lọc theo trạng thái (active = chưa xóa, deleted = đã xóa)'
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
                  total: { type: 'number', example: 150 },
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 20 },
                  totalPages: { type: 'number', example: 8 },
                  users: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        user_id: { type: 'number', example: 1 },
                        name: { type: 'string', example: 'Nguyễn Văn A' },
                        email: { type: 'string', example: 'nguyenvana@example.com' },
                        phone_number: { type: 'string', example: '0123456789' },
                        role: { type: 'string', example: 'TEACHER' },
                        role_name: { type: 'string', example: 'Giáo viên' },
                        is_deleted: { type: 'number', example: 0 },
                        created_date: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_VIEW' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/users/create': {
    post: {
      tags: ['User Management (Admin)'],
      summary: 'Create new user (Admin only)',
      description: 'Tạo người dùng mới (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password'],
              properties: {
                name: {
                  type: 'string',
                  example: 'Nguyễn Văn B',
                  description: 'Tên người dùng'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'nguyenvanb@example.com',
                  description: 'Email (phải unique)'
                },
                password: {
                  type: 'string',
                  minLength: 6,
                  example: 'password123',
                  description: 'Mật khẩu (tối thiểu 6 ký tự)'
                },
                phone_number: {
                  type: 'string',
                  example: '0987654321',
                  description: 'Số điện thoại'
                },
                gender: {
                  type: 'string',
                  example: 'Male',
                  description: 'Giới tính'
                },
                address: {
                  type: 'string',
                  example: '456 Đường XYZ, Phường 2, TP.HCM',
                  description: 'Địa chỉ'
                },
                birth_day: {
                  type: 'string',
                  format: 'date',
                  example: '1995-05-15',
                  description: 'Ngày sinh (YYYY-MM-DD)'
                },
                role: {
                  type: 'string',
                  enum: ['ADMIN', 'TEACHER', 'STUDENT'],
                  example: 'STUDENT',
                  default: 'STUDENT',
                  description: 'Role của người dùng'
                },
                school_id: {
                  type: 'number',
                  example: 1,
                  description: 'ID trường học'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Tạo người dùng thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Tạo người dùng thành công' },
                  user: {
                    type: 'object',
                    properties: {
                      user_id: { type: 'number' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin bắt buộc hoặc email không hợp lệ/đã tồn tại' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_CREATE' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/users/{userId}': {
    get: {
      tags: ['User Management (Admin)'],
      summary: 'Get user by ID (Admin only)',
      description: 'Lấy thông tin chi tiết người dùng theo ID (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng cần xem'
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
                  user_id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Nguyễn Văn A' },
                  email: { type: 'string', example: 'nguyenvana@example.com' },
                  phone_number: { type: 'string', example: '0123456789' },
                  gender: { type: 'string', example: 'Male' },
                  address: { type: 'string', example: '123 Đường ABC' },
                  birth_day: { type: 'string', format: 'date' },
                  role: { type: 'string', example: 'TEACHER' },
                  role_name: { type: 'string', example: 'Giáo viên' },
                  school_id: { type: 'number', example: 1 },
                  avatar_location: { type: 'string' },
                  is_deleted: { type: 'number', example: 0 },
                  is_oauth2: { type: 'number', example: 0 },
                  created_by: { type: 'string' },
                  created_date: { type: 'string', format: 'date-time' },
                  modified_by: { type: 'string' },
                  modified_date: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_VIEW' },
        404: { description: 'Không tìm thấy người dùng' },
        500: { description: 'Lỗi server' }
      }
    },
    put: {
      tags: ['User Management (Admin)'],
      summary: 'Update user information (Admin only)',
      description: 'Cập nhật thông tin người dùng (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng cần cập nhật'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'Nguyễn Văn C',
                  description: 'Tên người dùng'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'nguyenvanc@example.com',
                  description: 'Email mới (phải unique)'
                },
                phone_number: {
                  type: 'string',
                  example: '0909123456',
                  description: 'Số điện thoại'
                },
                gender: {
                  type: 'string',
                  example: 'Female',
                  description: 'Giới tính'
                },
                address: {
                  type: 'string',
                  example: '789 Đường DEF',
                  description: 'Địa chỉ'
                },
                birth_day: {
                  type: 'string',
                  format: 'date',
                  example: '1990-03-20',
                  description: 'Ngày sinh'
                },
                avatar_location: {
                  type: 'string',
                  example: '/uploads/avatars/avatar.jpg',
                  description: 'Đường dẫn avatar'
                },
                school_id: {
                  type: 'number',
                  example: 2,
                  description: 'ID trường học'
                }
              },
              description: 'Tất cả các trường đều optional, chỉ cần gửi những trường cần cập nhật'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cập nhật thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Cập nhật người dùng thành công' },
                  user_id: { type: 'number' }
                }
              }
            }
          }
        },
        400: { description: 'Email không hợp lệ hoặc đã tồn tại' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_UPDATE' },
        404: { description: 'Không tìm thấy người dùng' },
        500: { description: 'Lỗi server' }
      }
    },
    delete: {
      tags: ['User Management (Admin)'],
      summary: 'Delete user (Admin only)',
      description: 'Xóa người dùng - soft delete (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng cần xóa'
        }
      ],
      responses: {
        200: {
          description: 'Xóa thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Xóa người dùng thành công' },
                  user_id: { type: 'number' }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_DELETE' },
        404: { description: 'Không tìm thấy người dùng' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/users/{userId}/restore': {
    put: {
      tags: ['User Management (Admin)'],
      summary: 'Restore deleted user (Admin only)',
      description: 'Khôi phục người dùng đã xóa (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng cần khôi phục'
        }
      ],
      responses: {
        200: {
          description: 'Khôi phục thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Khôi phục người dùng thành công' },
                  user_id: { type: 'number' }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_UPDATE' },
        404: { description: 'Không tìm thấy người dùng đã xóa' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/users/{userId}/reset-password': {
    put: {
      tags: ['User Management (Admin)'],
      summary: 'Reset user password (Admin only)',
      description: 'Admin reset mật khẩu cho người dùng (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng cần reset mật khẩu'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['newPassword'],
              properties: {
                newPassword: {
                  type: 'string',
                  minLength: 6,
                  example: 'newPassword123',
                  description: 'Mật khẩu mới (tối thiểu 6 ký tự)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Reset mật khẩu thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Reset mật khẩu thành công' },
                  user_id: { type: 'number' }
                }
              }
            }
          }
        },
        400: { description: 'Mật khẩu mới không hợp lệ (quá ngắn)' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_UPDATE' },
        404: { description: 'Không tìm thấy người dùng' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/users/{userId}/change-role': {
    put: {
      tags: ['User Management (Admin)'],
      summary: 'Change user role (Admin only)',
      description: 'Thay đổi role của người dùng (chỉ Admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID người dùng cần thay đổi role'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['ADMIN', 'TEACHER', 'STUDENT'],
                  example: 'TEACHER',
                  description: 'Role mới của người dùng'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Thay đổi role thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Thay đổi role thành công' },
                  user_id: { type: 'number' },
                  old_role: { type: 'string', example: 'STUDENT' },
                  new_role: { type: 'string', example: 'TEACHER' }
                }
              }
            }
          }
        },
        400: { description: 'Role không hợp lệ hoặc giống role hiện tại' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền USER_ASSIGN_ROLE' },
        404: { description: 'Không tìm thấy người dùng' },
        500: { description: 'Lỗi server' }
      }
    }
  }
};

module.exports = swaggerDocs;
