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

  '/api/organizations/{orgId}/assign-manager': {
    post: {
      tags: ['Permission Management'],
      summary: 'Assign organization manager',
      description: 'Gán người phụ trách cho tổ chức (Admin hoặc có quyền ORG_ASSIGN_MANAGER)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID tổ chức'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['user_id'],
              properties: {
                user_id: {
                  type: 'number',
                  example: 5,
                  description: 'ID người dùng sẽ làm người phụ trách'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Gán người phụ trách thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Gán người phụ trách thành công' },
                  organization_id: { type: 'number' },
                  manager_user_id: { type: 'number' }
                }
              }
            }
          }
        },
        400: { description: 'Thiếu thông tin user_id' },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền thực hiện hành động này' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/organizations/{orgId}/remove-manager/{userId}': {
    delete: {
      tags: ['Permission Management'],
      summary: 'Remove organization manager',
      description: 'Gỡ người phụ trách khỏi tổ chức (Admin hoặc có quyền ORG_ASSIGN_MANAGER)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'orgId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 1
          },
          description: 'ID tổ chức'
        },
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'number',
            example: 5
          },
          description: 'ID người phụ trách cần gỡ'
        }
      ],
      responses: {
        200: {
          description: 'Gỡ người phụ trách thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Gỡ người phụ trách thành công' },
                  organization_id: { type: 'number' },
                  user_id: { type: 'number' }
                }
              }
            }
          }
        },
        401: { description: 'Chưa đăng nhập' },
        403: { description: 'Không có quyền thực hiện hành động này' },
        404: { description: 'Không tìm thấy người phụ trách' },
        500: { description: 'Lỗi server' }
      }
    }
  },

  '/api/organizations/{orgId}/managers': {
    get: {
      tags: ['Permission Management'],
      summary: 'Get organization managers',
      description: 'Lấy danh sách người phụ trách của tổ chức',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'orgId',
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
                  total: { type: 'number', example: 2 },
                  managers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        user_id: { type: 'number' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string', example: 'MANAGER' },
                        assigned_by: { type: 'string' },
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
  }
};

module.exports = swaggerDocs;
