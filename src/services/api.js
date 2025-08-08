import { jwtDecode } from 'jwt-decode';

const BASE_URL = 'http://localhost:5000';
export const AUTH_TOKEN_KEY = 'authToken';

export async function apiRequest(endpoint, method = 'GET', body = null, tokenParam = null, isFormData = false) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers();

    if (!isFormData) {
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
    }

    const token = tokenParam || localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    const config = {
        method: method.toUpperCase(),
        headers,
    };

    if (body && ['POST', 'PATCH', 'PUT'].includes(config.method)) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem('admin_name');
            localStorage.removeItem('teacher_name');
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            const authError = new Error('Autentifikatsiya xatoligi. Iltimos, qayta kiring.');
            authError.statusCode = 401;
            authError.isAuthError = true;
            throw authError;
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }

        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType?.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
            if (!response.ok) {
                responseData = { message: responseData || `Serverdan noma'lum javob (status: ${response.status})` };
            } else {
                return responseData;
            }
        }

        if (!response.ok) {
            const errorMessage = responseData?.message || responseData?.error || `HTTP xatolik! Status: ${response.status}`;
            const error = new Error(Array.isArray(errorMessage) ? errorMessage.join('; ') : String(errorMessage));
            error.statusCode = response.status;
            error.originalError = responseData;
            throw error;
        }

        return responseData;
    } catch (error) {
        if (error.isAuthError) {
            throw error;
        }
        const displayMessage = error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')
            ? 'Serverga ulanib bo\'lmadi. Internet aloqangizni yoki server manzilini tekshiring.'
            : error.message || 'Server bilan bog\'lanishda xatolik yuz berdi.';
        const processedError = new Error(displayMessage);
        processedError.statusCode = error.statusCode || 503;
        processedError.originalError = error;
        throw processedError;
    }
}

export const loginTeacher = async (phone, password) => {
    try {
        const data = await apiRequest('/auth/teacher', 'POST', { phone, password });
        if (data?.accessToken) {
            localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
            try {
                const decoded = jwtDecode(data.accessToken);
                const teacherName = `${decoded?.name || ''} ${decoded?.lastname || ''}`.trim() || 'O\'qituvchi';
                localStorage.setItem('teacher_name', teacherName);
                return { success: true, token: data.accessToken, name: teacherName };
            } catch (decodeError) {
                return { success: true, token: data.accessToken, name: 'O\'qituvchi' };
            }
        }
        throw new Error('Serverdan token olinmadi.');
    } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('teacher_name');
        throw new Error(error.message || 'Login amalga oshmadi.');
    }
};

export const logoutTeacher = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('teacher_name');
    if (typeof window !== 'undefined') window.location.href = '/login';
};

export const fetchTeacherData = async (teacherId, token) => {
    if (!teacherId) throw new Error("O'qituvchi ID si ko'rsatilmagan.");
    return apiRequest(`/teachers/${teacherId}`, 'GET', null, token);
};

export const updateTeacherProfile = async (teacherId, profileData, token) => {
    if (!teacherId) throw new Error("O'qituvchi ID si ko'rsatilmagan.");
    let body = profileData;
    let isFormData = false;
    if (profileData.image instanceof File) {
        isFormData = true;
        const formData = new FormData();
        Object.entries(profileData).forEach(([key, value]) => {
            if (key !== 'image' && value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });
        formData.append('image', profileData.image);
        body = formData;
    }
    return apiRequest(`/teachers/${teacherId}`, 'PATCH', body, token, isFormData);
};

export const fetchTeacherGroups = async (teacherId, token) => {
    if (!teacherId) throw new Error("O'qituvchi ID si ko'rsatilmagan.");
    const queryParams = new URLSearchParams({ filterByTeacherId: teacherId }).toString();
    return apiRequest(`/groups?${queryParams}`, 'GET', null, token);
};

export const fetchTeacherActiveStudents = async (teacherId, token) => {
    if (!teacherId) throw new Error("O'qituvchi ID si ko'rsatilmagan.");
    const queryParams = new URLSearchParams({ filterByTeacherId: teacherId, staus: "FAOL" }).toString();
    return apiRequest(`/groups?${queryParams}`, 'GET', null, token);
};


export const fetchGroupStudents = async (groupId, token) => {
    if (!groupId) throw new Error("Guruh ID si ko'rsatilmagan.");
    const queryParams = new URLSearchParams({ filterByGroupId: groupId, limit: '100' }).toString();
    return apiRequest(`/students?${queryParams}`, 'GET', null, token);
};

// Modified saveAttendance to accept a single attendance record (CreateAttendanceDto)
export const saveAttendance = async (attendanceRecord, token) => {
    if (!attendanceRecord?.groupId || !attendanceRecord?.studentId || !attendanceRecord?.date || !attendanceRecord?.status) {
        throw new Error('Davomat ma\'lumotlari to\'liq emas (groupId, studentId, date, status talab qilinadi).');
    }
    // Directly pass the attendanceRecord as the body since it's already in the correct DTO format
    return apiRequest('/attendances', 'POST', attendanceRecord, token);
};

// New function to update an existing attendance record
export const updateAttendance = async (attendanceId, updateData, token) => {
    if (!attendanceId) {
        throw new Error("Davomat ID si ko'rsatilmagan.");
    }
    if (!updateData?.status && !updateData?.date) {
        throw new Error("Yangilash uchun status yoki sana ma'lumotlari kiritilmagan.");
    }
    return apiRequest(`/attendances/${attendanceId}`, 'PATCH', updateData, token);
};


export const fetchAttendance = async (filters, token) => {
    const params = new URLSearchParams();
    if (filters.groupId) params.append('filterByGroupId', filters.groupId);
    if (filters.date) params.append('filterByDate', filters.date);
    params.append('limit', '100');
    return apiRequest(`/attendances?${params.toString()}`, 'GET', null, token);
};

export const getCurrentUserId = (token) => {
    try {
        const decoded = jwtDecode(token);
        return decoded.userId || decoded.sub;
    } catch (err) {
        return null;
    }
};

export const createDailyFeedback = async (feedbackData, token) => {
    if (!feedbackData?.studentId || !feedbackData?.groupId || feedbackData?.ball === undefined || !feedbackData?.feedback) {
        throw new Error("Kunlik fikr-mulohaza ma'lumotlari to'liq emas.");
    }
    return apiRequest('/daily-feedbacks', 'POST', feedbackData, token);
};

export const fetchDailyFeedbacksForGroup = async (groupId, token, queryParams = {}) => {
    if (!groupId) throw new Error("Guruh ID si ko'rsatilmagan.");
    const params = new URLSearchParams({ groupId, ...queryParams }).toString();
    return apiRequest(`/daily-feedbacks?${params}`, 'GET', null, token);
};

export const fetchDailyFeedbackById = async (feedbackId, token) => {
    if (!feedbackId) throw new Error("Fikr-mulohaza ID si ko'rsatilmagan.");
    return apiRequest(`/daily-feedbacks/${feedbackId}`, 'GET', null, token);
};

export const updateDailyFeedback = async (feedbackId, updateData, token) => {
    if (!feedbackId) throw new Error("Fikr-mulohaza ID si ko'rsatilmagan.");
    return apiRequest(`/daily-feedbacks/${feedbackId}`, 'PATCH', updateData, token);
};

export const deleteDailyFeedback = async (feedbackId, token) => {
    if (!feedbackId) throw new Error("Fikr-mulohaza ID si ko'rsatilmagan.");
    return apiRequest(`/daily-feedbacks/${feedbackId}`, 'DELETE', null, token);
};

export const fetchTopTeachers = async (token) => {
    return apiRequest('/teachers?sortBy=createdAt&status=LIDER', 'GET', null, token);
};
