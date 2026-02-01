# Vietsignschool API Documentation

> Base URL:
> - Production: `https://vietsignschoolbe-production.up.railway.app`
> - Development: `http://localhost:5000`

---

## 1. Authentication APIs (`/auth`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/login` | Đăng nhập | No |
| POST | `/auth/register` | Đăng ký tài khoản | No |

---

## 2. User APIs (`/users`)

### 2.1. User Management

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/users` | Lấy danh sách users | Auth |
| POST | `/users` | Tạo user mới | SUPER_ADMIN, CENTER_ADMIN |
| GET | `/users/:id` | Lấy user theo ID | Auth |

### 2.2. Profile

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/users/profile` | Lấy profile của user hiện tại | Auth |
| PUT | `/users/profile` | Cập nhật profile | Auth |

### 2.3. Teachers

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/users/teachers` | Lấy danh sách giáo viên | Auth |
| POST | `/users/teachers` | Tạo giáo viên | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| GET | `/users/teachers/:id` | Lấy giáo viên theo ID | Auth |
| PUT | `/users/teachers/:id` | Cập nhật giáo viên | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/users/teachers/:id` | Xóa giáo viên | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

### 2.4. Students

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/users/students` | Lấy danh sách học sinh | Auth |
| POST | `/users/students` | Tạo học sinh | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| GET | `/users/students/:id` | Lấy học sinh theo ID | Auth |
| PUT | `/users/students/:id` | Cập nhật học sinh | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/users/students/:id` | Xóa học sinh | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

### 2.5. Student Tracking

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| POST | `/users/students/tracking/view-lesson` | Ghi nhận xem bài học | Auth |
| POST | `/users/students/tracking/view-vocabulary` | Ghi nhận xem từ vựng | Auth |
| GET | `/users/students/progress/learning` | Lấy tiến độ học tập | Auth |

---

## 3. Organization APIs (`/organizations`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/organizations` | Lấy tất cả tổ chức | Auth |
| POST | `/organizations` | Tạo tổ chức | Auth |
| GET | `/organizations/:id` | Lấy tổ chức theo ID | Auth |
| PUT | `/organizations/:id` | Cập nhật tổ chức | Auth |
| DELETE | `/organizations/:id` | Xóa tổ chức | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

---

## 4. Organization Manager APIs (`/organization-managers`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/organization-managers` | Lấy users theo tổ chức | Auth |
| POST | `/organization-managers` | Gán quyền quản lý cho user | SUPER_ADMIN, CENTER_ADMIN |
| DELETE | `/organization-managers` | Thu hồi quyền quản lý | SUPER_ADMIN, CENTER_ADMIN |

---

## 5. Teaching Management APIs (`/teaching-management`)

### 5.1. Classrooms (`/teaching-management/classrooms`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/teaching-management/classrooms` | Lấy danh sách lớp học | Auth |
| POST | `/teaching-management/classrooms` | Tạo lớp học | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN, TEACHER |
| GET | `/teaching-management/classrooms/:classroomId` | Lấy chi tiết lớp học | Auth |
| PUT | `/teaching-management/classrooms/:classroomId` | Cập nhật lớp học | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN, TEACHER |
| DELETE | `/teaching-management/classrooms/:classroomId` | Xóa lớp học | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| POST | `/teaching-management/classrooms/:classroomId/students` | Thêm học sinh vào lớp | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN, TEACHER |
| GET | `/teaching-management/classrooms/:classroomId/students` | Lấy danh sách học sinh trong lớp | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN, TEACHER |
| DELETE | `/teaching-management/classrooms/:classroomId/students` | Xóa học sinh khỏi lớp | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

### 5.2. Lessons (`/teaching-management/lessons`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/teaching-management/lessons` | Lấy danh sách bài học | Auth |
| POST | `/teaching-management/lessons` | Tạo bài học | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| GET | `/teaching-management/lessons/:lessonId` | Lấy chi tiết bài học | Auth |
| PUT | `/teaching-management/lessons/:lessonId` | Cập nhật bài học | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/teaching-management/lessons/:lessonId` | Xóa bài học | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/teaching-management/lessons/topic/:topicId` | Xóa tất cả bài học theo topic | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

### 5.3. Vocabularies (`/teaching-management/vocabularies`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/teaching-management/vocabularies` | Lấy danh sách từ vựng | Auth |
| POST | `/teaching-management/vocabularies` | Tạo từ vựng | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| GET | `/teaching-management/vocabularies/:vocabularyId` | Lấy chi tiết từ vựng | Auth |
| PUT | `/teaching-management/vocabularies/:vocabularyId` | Cập nhật từ vựng | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/teaching-management/vocabularies/:vocabularyId` | Xóa từ vựng | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/teaching-management/vocabularies/topic/:topicId` | Xóa tất cả từ vựng theo topic | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

### 5.4. Topics (`/teaching-management/topics`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/teaching-management/topics` | Lấy danh sách chủ đề | Auth |
| POST | `/teaching-management/topics` | Tạo chủ đề | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| GET | `/teaching-management/topics/search/by-name` | Tìm kiếm chủ đề theo tên | Auth |
| GET | `/teaching-management/topics/statistics` | Thống kê chủ đề | Auth |
| GET | `/teaching-management/topics/classroom/:classroom_id` | Lấy chủ đề theo lớp học | Auth |
| GET | `/teaching-management/topics/creator/:creator_id` | Lấy chủ đề theo người tạo | Auth |
| GET | `/teaching-management/topics/:topic_id` | Lấy chi tiết chủ đề | Auth |
| PUT | `/teaching-management/topics/:topic_id` | Cập nhật chủ đề | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/teaching-management/topics/:topic_id` | Xóa chủ đề | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

### 5.5. Questions (`/teaching-management/questions`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/teaching-management/questions` | Lấy danh sách câu hỏi | Auth |
| POST | `/teaching-management/questions` | Tạo câu hỏi | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| GET | `/teaching-management/questions/search/by-content` | Tìm kiếm câu hỏi theo nội dung | Auth |
| GET | `/teaching-management/questions/statistics` | Thống kê câu hỏi | Auth |
| GET | `/teaching-management/questions/classroom/:classroom_id` | Lấy câu hỏi theo lớp học | Auth |
| GET | `/teaching-management/questions/creator/:creator_id` | Lấy câu hỏi theo người tạo | Auth |
| GET | `/teaching-management/questions/:question_id` | Lấy chi tiết câu hỏi | Auth |
| PUT | `/teaching-management/questions/:question_id` | Cập nhật câu hỏi | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/teaching-management/questions/:question_id` | Xóa câu hỏi | SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |

### 5.6. Exams (`/teaching-management/exams`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/teaching-management/exams` | Lấy danh sách bài thi | Auth |
| POST | `/teaching-management/exams` | Tạo bài thi | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| GET | `/teaching-management/exams/statistics` | Thống kê bài thi | Auth |
| GET | `/teaching-management/exams/classroom/:classroom_id` | Lấy bài thi theo lớp học | Auth |
| GET | `/teaching-management/exams/creator/:creator_id` | Lấy bài thi theo người tạo | Auth |
| GET | `/teaching-management/exams/type/:exam_type` | Lấy bài thi theo loại | Auth |
| GET | `/teaching-management/exams/:exam_id` | Lấy chi tiết bài thi | Auth |
| PUT | `/teaching-management/exams/:exam_id` | Cập nhật bài thi | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| DELETE | `/teaching-management/exams/:exam_id` | Xóa bài thi | TEACHER, SUPER_ADMIN, CENTER_ADMIN, SCHOOL_ADMIN |
| POST | `/teaching-management/exams/:exam_id/submit` | Nộp bài thi | STUDENT |
| GET | `/teaching-management/exams/:exam_id/results` | Lấy kết quả bài thi | Auth |
| GET | `/teaching-management/exams/student/:student_id/attempts` | Lấy lịch sử làm bài của học sinh | Auth |

### 5.7. Progress (`/teaching-management/progress`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/teaching-management/progress/my-progress` | Lấy tiến độ cá nhân | STUDENT, TEACHER, Admin |
| GET | `/teaching-management/progress/classroom/:classroomId/summary` | Tổng hợp tiến độ lớp học | TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId` | Lấy tiến độ học sinh | TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId/exams` | Lấy lịch sử thi của học sinh | STUDENT, TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId/lessons` | Lấy tiến độ bài học của học sinh | STUDENT, TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId/vocabularies` | Lấy tiến độ từ vựng của học sinh | STUDENT, TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId/classroom/:classroomId` | Lấy tiến độ theo lớp học | STUDENT, TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId/date-range` | Lấy tiến độ theo khoảng thời gian | STUDENT, TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId/classroom/:classroomId/comparison` | So sánh tiến độ với lớp | STUDENT, TEACHER, Admin |
| GET | `/teaching-management/progress/student/:studentId/trends` | Lấy xu hướng học tập | STUDENT, TEACHER, Admin |

---

## 6. Misc APIs

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/me` | Lấy thông tin user đã đăng nhập | Auth |
| GET | `/api-docs` | Swagger API Documentation | No |

---

## Roles (Quyền)

| Role | Mô tả |
|------|-------|
| `SUPER_ADMIN` | Quản trị viên cao nhất |
| `CENTER_ADMIN` | Quản trị viên trung tâm |
| `SCHOOL_ADMIN` | Quản trị viên trường |
| `TEACHER` | Giáo viên |
| `STUDENT` | Học sinh |

---

## Authentication

Tất cả các API có yêu cầu **Auth** đều cần gửi token trong header:

```
Authorization: Bearer <access_token>
```

---

## Tổng kết

| Nhóm API | Số lượng endpoints |
|----------|-------------------|
| Authentication | 2 |
| Users | 18 |
| Organizations | 5 |
| Organization Managers | 3 |
| Classrooms | 8 |
| Lessons | 6 |
| Vocabularies | 6 |
| Topics | 9 |
| Questions | 9 |
| Exams | 12 |
| Progress | 10 |
| Misc | 2 |
| **Tổng cộng** | **~90 endpoints** |

---

*Generated from source code in `src/routes/` and `src/features/teaching-management/routes/`*
