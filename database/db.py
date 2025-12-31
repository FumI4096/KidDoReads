from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash
from mysql.connector import pooling
from modules.cache import cache 

load_dotenv()

try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="kiddoreads_pool",
        pool_size=20,
        pool_reset_session=True,
        host=os.getenv('MYSQL_HOST'),
        user=os.getenv('MYSQL_USER'),
        password=os.getenv('MYSQL_PASSWORD'),
        database=os.getenv('MYSQL_DB'),
        port=int(os.getenv('MYSQL_PORT', 3306)),
        charset='utf8mb4'
    )
except Exception as e:
    print(f"Error creating connection pool: {e}")
    raise

class Database:
    def __init__(self):
        self.connection = None
        self.cursor = None
        try:
            self.connection = connection_pool.get_connection()
            self.cursor = self.connection.cursor()
        except Exception as e:
            print(f"Database Connection Error: {e}")
            self.__exit__(None, None, None)
            raise
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Always close cursor and connection"""
        if self.cursor is not None:
            try:
                self.cursor.close()
            except:
                pass
            finally:
                self.cursor = None
        
        if self.connection is not None:
            try:
                self.connection.close()
            except:
                pass
            finally:
                self.connection = None
    
    def __del__(self):
        """Fallback cleanup"""
        self.__exit__(None, None, None)

    def insert_student(self, school_id, fname, lname, email, password, image, section):
        try:
            hashed_password = generate_password_hash(password)
            query = """
                INSERT INTO students (StudentID, FirstName, LastName, Email, S_Password, Image, SectionID)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            self.cursor.execute(query, (school_id, fname, lname, email, hashed_password, image, section))
            self.connection.commit()
            for filter_type in ['default', 'id']:
                cache.delete(f'student_records_{filter_type}')
            return True, "Student inserted successfully."
        except Exception as e:
            self.connection.rollback()
            return False, str(e)
        
    def bulk_insert_students(self, students_data):
        """
        Bulk insert multiple students at once.
        
        Args:
            students_data: List of tuples containing (StudentID, FirstName, LastName, Email, S_Password, Image, SectionID)
        
        Returns:
            Tuple of (success: bool, message: str, count: int)
        """
        try:
            query = """
                INSERT INTO students (StudentID, FirstName, LastName, Email, S_Password, Image, SectionID)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            self.cursor.executemany(query, students_data)
            self.connection.commit()
            for filter_type in ['default', 'id']:
                cache.delete(f'student_records_{filter_type}')
            
            return True, "Students inserted successfully.", len(students_data)
            
        except Exception as e:
            # Rollback on error
            self.connection.rollback()
            return False, str(e), 0

    def insert_teacher(self, school_id, fname, lname, email, password, image):
        try:
            hashed_password = generate_password_hash(password)
            query = """
                INSERT INTO teachers (TeacherID, FirstName, LastName, Email, T_Password, Image)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            self.cursor.execute(query, (school_id, fname, lname, email, hashed_password, image))
            self.connection.commit()
            for filter_type in ['default', 'id']:
                cache.delete(f'teacher_records_{filter_type}')
            return True, "Teacher inserted successfully."
        except Exception as e:
            self.connection.rollback()
            return False, str(e)

    def insert_admin(self, school_id, fname, lname, email, password, image):
        try:
            hashed_password = generate_password_hash(password)
            query = """
                INSERT INTO admin (AdminID, FirstName, LastName, Email, A_Password, Image)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            self.cursor.execute(query, (school_id, fname, lname, email, hashed_password, image))
            self.connection.commit()
            for filter_type in ['default', 'id']:
                cache.delete(f'admin_records_{filter_type}')
            return True, "Admin inserted successfully."
        except Exception as e:
            self.connection.rollback()
            return False, str(e)
    
    def get_student_records(self, filter = "default", sectionFilter = 1):
        cache_key = f'student_records_{filter}_{sectionFilter}'
        cached = cache.get(cache_key)
        if cached: return cached
        
        allowed_filters = {
            "default": "students.createdAt DESC",
            "id": "StudentID DESC"
        }
        filter_order = allowed_filters.get(filter, "students.createdAt DESC")
        
        query = f"""
            SELECT StudentID, FirstName, LastName, Email, Image, R_Name FROM students 
            LEFT JOIN roles on S_Role = roles.R_ID
            WHERE SectionID = %s
            ORDER BY {filter_order}
        """
        
        try:
            self.cursor.execute(query, (sectionFilter,))
            result = (True, self.cursor.fetchall())
            cache.set(cache_key, result, timeout=180)  # ADD THIS LINE
            return result
        except Exception as e:
            self.connection.rollback()
            return False, str(e)
    
    def get_teacher_records(self, filter = "default"):
        cache_key = f'teacher_records_{filter}'
        cached = cache.get(cache_key)
        if cached: return cached
        
        allowed_filters = {
            "default": "teachers.createdAt DESC",
            "id": "TeacherID DESC"
        }
        filter_order = allowed_filters.get(filter, "teachers.createdAt DESC")
        
        query = f"""SELECT TeacherID, FirstName, LastName, Email, Image, R_Name FROM teachers LEFT JOIN roles on T_Role = roles.R_ID ORDER BY {filter_order}"""
        
        try:
            self.cursor.execute(query)
            result = (True, self.cursor.fetchall())
            cache.set(cache_key, result, timeout=180)  # ADD THIS LINE
            return result
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def get_admin_records(self, filter = "default"):
        cache_key = f'admin_records_{filter}'
        cached = cache.get(cache_key)
        if cached: return cached
        allowed_filters = {
            "default": "admin.createdAt DESC",
            "id": "AdminID DESC"
        }
        filter_order = allowed_filters.get(filter, "admin.createdAt DESC")
        
        query = f"""
        SELECT AdminID, FirstName, LastName, Email, Image, R_Name FROM admin LEFT JOIN roles on A_Role = roles.R_ID ORDER BY {filter_order}
        """
        
        try:
            self.cursor.execute(query)
            result = (True, self.cursor.fetchall())
            cache.set(cache_key, result, timeout=180)  # ADD THIS LINE
            return result
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
    
    def modify_user_record(self, original_school_id: int, school_id: int, fname: str, lname: str, email: str, password: str, image: bytes, role: str):
        if role == "student":
            table = "students"
            idColumn = "StudentID"
            passwordColumn = "S_Password"
        elif role == "teacher":
            table = "teachers"
            idColumn = "TeacherID"
            passwordColumn = "T_Password"
        elif role == "admin":
            table = "admin"
            idColumn = "AdminID"
            passwordColumn = "A_Password"
            
        setClauses = []
        parameters = []
        
        setClauses.append(f"{idColumn} = %s")
        parameters.append(school_id)
        setClauses.append("FirstName = %s")
        parameters.append(fname)
        setClauses.append("LastName = %s")
        parameters.append(lname)
        setClauses.append("Email = %s")
        parameters.append(email)
        
        if password:
            hashed_password = generate_password_hash(password)
            setClauses.append(f"{passwordColumn} = %s")
            parameters.append(hashed_password)
            
        if image:
            setClauses.append("Image = %s")
            parameters.append(image)
            
        setClauses = ", ".join(setClauses)
        query = f"UPDATE {table} SET {setClauses} WHERE {idColumn} = %s"
        parameters.append(original_school_id)
        
        try:
            self.cursor.execute(query, tuple(parameters))
            if self.cursor.rowcount > 0:
                self.connection.commit()
                # FIXED: Clear all filter variations
                for filter_type in ['default', 'id']:
                    cache.delete(f'student_records_{filter_type}')
                    cache.delete(f'teacher_records_{filter_type}')
                    cache.delete(f'admin_records_{filter_type}')
                
                # Clear user info for both old and new IDs
                cache.delete(f'user_info_{original_school_id}')
                cache.delete(f'user_info_{school_id}')
                return True, "User record updated successfully."
            else:
                return False, "User record not found or no changes were made."
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def delete_user_record(self, id: int, role: str):
        if role == "student":
            table = "students"
            idColumn = "StudentID"
        elif role == "teacher":
            table = "teachers"
            idColumn = "TeacherID"
        elif role == "admin":
            table = "admin"
            idColumn = "AdminID"
        query = f"DELETE FROM {table} WHERE {idColumn} = %s"

        try:
            self.cursor.execute(query, (id,))
            if self.cursor.rowcount > 0:
                self.connection.commit()
                # FIXED: Clear all filter variations
                for filter_type in ['default', 'id']:
                    cache.delete(f'student_records_{filter_type}')
                    cache.delete(f'teacher_records_{filter_type}')
                    cache.delete(f'admin_records_{filter_type}')
                
                # Clear user info
                cache.delete(f'user_info_{id}')
                
                # ADDED: If teacher, clear their content cache too
                if role == "teacher":
                    cache.delete(f'contents_teacher_{id}')
                    # Clear all content type caches since teacher's content affects them
                    for type_id in range(0, 6):  # Adjust range based on your content types
                        cache.delete(f'contents_type_{type_id}')
                return True, "Record deleted successfully."
            else:
                return False, f"User with ID {id} not found."
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def get_password_by_id(self, id):
        try:
            query = """
                SELECT S_Password AS Password FROM students WHERE StudentID = %s
                UNION ALL
                SELECT T_Password FROM teachers WHERE TeacherID = %s
                UNION ALL
                SELECT A_Password FROM admin WHERE AdminID = %s
            """
            self.cursor.execute(query, (id, id, id))
            record = self.cursor.fetchone()
            return record or None
        except Exception as e:
            self.connection.rollback() 
            return str(e)
    
    def get_role_by_id(self, id):
        try:
            query = """
                SELECT T1.R_Name FROM students
                LEFT JOIN roles T1 ON students.S_Role = T1.R_ID
                WHERE StudentID = %s
                UNION
                SELECT T2.R_Name FROM teachers
                LEFT JOIN roles T2 ON teachers.T_Role = T2.R_ID
                WHERE TeacherID = %s
                UNION
                SELECT T3.R_Name FROM admin
                LEFT JOIN roles T3 ON admin.A_Role = T3.R_ID
                WHERE AdminID = %s
            """
            self.cursor.execute(query, (id, id, id))
            record = self.cursor.fetchone()
            
            if record:
                return record  
            else:
                return None
        except Exception as e:
            return str(e)
        
    def get_user_info_by_id(self, id):
        cache_key = f'user_info_{id}'
        cached = cache.get(cache_key)
        
        print("Cached User Info:", cached)
        if cached: return cached
        try:
            query = """
                SELECT ID, FullName, Email, Image, Section FROM (
                    SELECT StudentID AS ID, CONCAT(FirstName, ' ', LastName) AS FullName, Email, Image, se.S_Names as Section
                    FROM students
                    LEFT JOIN section as se ON students.SectionID = se.S_ID
                    WHERE StudentID = %s
                    UNION ALL
                    SELECT T.TeacherID AS ID, CONCAT(T.FirstName, ' ', T.LastName) AS FullName, T.Email, T.Image,
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'sectionid', S.S_ID,
                                'sectionname', S.S_Names
                            )
                        ) AS Section
                    FROM teachers AS T
                    LEFT JOIN JSON_TABLE(
                        T.Assigned_Sections,
                        '$[*]' COLUMNS(SectionID INT PATH '$')
                    ) AS jt ON TRUE
                    LEFT JOIN section AS S
                        ON jt.SectionID = S.S_ID
                    WHERE T.TeacherID = %s
                    GROUP BY T.TeacherID
                    UNION ALL
                    SELECT AdminID AS ID, CONCAT(FirstName, ' ', LastName) AS FullName, Email, Image, NULL AS Section
                    FROM admin
                    WHERE AdminID = %s
                ) AS combined
            """
            self.cursor.execute(query, (id, id, id))
            record = self.cursor.fetchone()

            result = (True, record) if record else (True, None)
            cache.set(cache_key, result, timeout=600)  # ADD THIS LINE - cache 10 minutes
            
            print(result)
            return result
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)        
    
    def id_exist(self, id):
        try:
            query = """
                SELECT StudentID AS ID FROM students WHERE StudentID = %s
                UNION
                SELECT TeacherID FROM teachers WHERE TeacherID = %s
                UNION
                SELECT AdminID FROM admin WHERE AdminID = %s
            """
            
            self.cursor.execute(query, (id, id, id))
            record = self.cursor.fetchone()

            if record:
                return True
            else:
                return False
        except Exception as e:
            self.connection.rollback() 
            return f"Database error: {e}"
        
    def email_exist(self, email):
        try:
            query = """
                SELECT Email FROM students WHERE Email = %s
                UNION
                SELECT Email FROM teachers WHERE Email = %s
                UNION
                SELECT Email FROM admin WHERE Email = %s
            """
            self.cursor.execute(query, (email, email, email))
            record = self.cursor.fetchone()

            if record:
                return True
            else:
                return False
        except Exception as e:
            self.connection.rollback() 
            return f"Database error: {e}"
        
    def create_content(self, teacher_id: int, content_name, content_type: int):
        try:
            query = """INSERT INTO contents(TeacherID, Content_Title, ContentType) VALUES (%s, %s, %s)"""
            
            self.cursor.execute(query, (teacher_id, content_name, content_type))
            content_id = self.cursor.lastrowid
            self.connection.commit()
            return True, "Content created successfully!", content_id
        except Exception as e:
            self.connection.rollback() 
            return False, f"Database error: {e}", None
        
    def update_tts_id_in_content_after_creation(self, content_id, tts_id):
        query = """UPDATE contents SET TTS_ID = %s WHERE ContentID = %s"""
            
        try:
            self.cursor.execute(query, (content_id, tts_id))
            if self.cursor.rowcount > 0:
                self.connection.commit()
                return True, "TTS ID in this content updated successfully!"
            else:
                return False, "Unsuccessful update"
        except Exception as e:
            return False, str(e)
        
    def get_content_name(self, teacher_id: int, content_name):
        try:
            query = "SELECT Content_Title FROM contents WHERE TeacherID = %s AND Content_Title = %s"
            self.cursor.execute(query, (teacher_id, content_name))
            record = self.cursor.fetchone()
            
            if record:
                return True, record
            else:
                return False, None
        except Exception as e:
            return False, str(e)
        
    def get_contents_by_teacher(self, teacher_id):
        cache_key = f'contents_teacher_{teacher_id}'
        cached = cache.get(cache_key)
        if cached: return cached
        query = """
            SELECT ContentID, Content_Title, Content_Details_JSON, TTS_JSON, ContentType, ContentTypeName, isHiddenFromStudents
            FROM contents
            LEFT JOIN content_type ON contents.ContentType = content_type.ContentTypeID
            LEFT JOIN tts_content on contents.tts_id = tts_content.tts_id
            WHERE TeacherID = %s
        """
        
        try:
            self.cursor.execute(query, (teacher_id,))
            results = self.cursor.fetchall()
            result = (True, results)
            cache.set(cache_key, result, timeout=120) 
            return result
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def get_contents_by_type(self, type, student_id):
        cache_key = f'contents_type_{type}_{student_id}'
        cached = cache.get(cache_key)
        if cached: return cached
        query = ""
        
        if type != 0:
            query = """
                SELECT
                    C.ContentID,
                    CONCAT(T.FirstName, ' ', T.LastName) AS Full_Name,
                    C.Content_Title,
                    C.Content_Details_JSON,
                    tts_content.tts_json,
                    C.ContentType
                FROM contents AS C
                LEFT JOIN teachers AS T
                    ON C.TeacherID = T.TeacherID
                LEFT JOIN tts_content
                    ON tts_content.tts_id = C.tts_id
                INNER JOIN students AS S
                    ON JSON_CONTAINS(
                        T.assigned_sections,
                        JSON_QUOTE(CAST(S.SectionID AS CHAR))
                    )
                WHERE
                    C.ContentType = %s AND S.StudentID = %s AND isHiddenFromStudents != 1;
            """
            try:
                self.cursor.execute(query, (type, student_id))
                result = (True, self.cursor.fetchall())
                cache.set(cache_key, result, timeout=120)  # ADD THIS LINE
                return result
            except Exception as e:
                return False, f"Database error: {e}"
        else:
            query = """
                SELECT ContentID, CONCAT(T.FirstName, ' ', T.LastName) as Full_Name, Content_Title, Content_Details_JSON, tts_json, ContentType, isHiddenFromStudents FROM contents as C
                LEFT JOIN teachers as T on C.TeacherID = T.TeacherID
                LEFT JOIN tts_content on tts_content.tts_id = C.tts_id
            """
            try:
                self.cursor.execute(query)
                result = (True, self.cursor.fetchall())
                cache.set(cache_key, result, timeout=120)  # ADD THIS LINE
                return result
            except Exception as e:
                return False, f"Database error: {e}"
    
    def get_contents_by_type(self, content_type, teacher_id):
        query = """
            SELECT
            contentid,
            Content_Title,
            tts_json,
            content_details_json
            FROM contents
            LEFT JOIN tts_content ON contents.tts_id = tts_content.tts_id
            WHERE contenttype = %s AND TeacherID = %s AND content_details_json is not NULL;
        """
        try:
            self.cursor.execute(query, (content_type, teacher_id))
            result = (True, self.cursor.fetchall())
            #cache.set(cache_key, result, timeout=120)  # ADD THIS LINE
            return result
        except Exception as e:
            return False, f"Database error: {e}"
    
    def get_assessments_by_type(self, type):
        cache_key = f'assessments_type_{type}'
        cached = cache.get(cache_key)
        if cached: return cached
        query = ""
        
        if type != 0:
            query = """
                SELECT 
                AssessmentID, 
                Assessment_Title, 
                Assessment_Details_JSON, 
                TTS_JSON, 
                AssessmentType 
                FROM assessments
                WHERE AssessmentType = %s;
            """
            try:
                self.cursor.execute(query, (type,))
                result = (True, self.cursor.fetchall())
                cache.set(cache_key, result, timeout=120)  # ADD THIS LINE
                return result
            except Exception as e:
                return False, f"Database error: {e}"
        else:
            query = """
                SELECT 
                AssessmentID, 
                Assessment_Title, 
                Assessment_Details_JSON, 
                TTS_JSON, 
                AssessmentType
                FROM assessments
            """
            try:
                self.cursor.execute(query)
                result = (True, self.cursor.fetchall())
                cache.set(cache_key, result, timeout=120)  # ADD THIS LINE
                return result
            except Exception as e:
                return False, f"Database error: {e}"
            
    def get_assessments(self):
        cache_key = 'all_assessments'
        cached = cache.get(cache_key)
        if cached: return cached
        query = """
            SELECT 
            AssessmentID, Assessment_Title, Assessment_Details_JSON, 
            TTS_JSON, 
            AssessmentType, 
            ContentTypeName
            FROM assessments
            LEFT JOIN content_type ON assessments.AssessmentType = content_type.ContentTypeID
        """
        
        try:
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            result = (True, results)
            cache.set(cache_key, result, timeout=120)  # ADD THIS LINE
            return result
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)        
        
    def delete_content(self, teacher_id: int, content_id: int):
        query = "DELETE FROM contents WHERE TeacherID = %s AND ContentID = %s"
        
        self.cursor.execute(query, (teacher_id, content_id))
        
        try:
            if self.cursor.rowcount > 0:
                self.connection.commit()
                cache.delete(f'contents_teacher_{teacher_id}')
                # Clear all content type caches
                for type_id in range(0, 6):  # Adjust range based on your content types
                    cache.delete(f'contents_type_{type_id}')
                return True, f"Activity deleted successfully."
            else:
                return False, "Content not found."
        except Exception as e:
            self.connection.rollback() 
            return False, f"Database error: {e}"
            
    def update_content_title(self, teacher_id: int, original_title, new_title):
        query = "UPDATE contents SET Content_Title = %s WHERE TeacherID = %s AND Content_Title = %s"
        
        self.cursor.execute(query, (new_title, teacher_id, original_title))
        
        try:
            if self.cursor.rowcount > 0:
                self.connection.commit()
                return True, "Content title updated successfully."
            else:
                return False, "Content not found."
        except Exception as e:
            self.connection.rollback() 
            return False, f"Database error: {e}"
        
    def update_content(self, teacher_id: int, content_id, content, total_questions: int):
        try:
            query = "UPDATE contents SET Content_Details_JSON = %s, TotalQuestions = %s WHERE TeacherID = %s AND ContentID = %s"
            
            self.cursor.execute(query, (content, total_questions, teacher_id, content_id))
            if self.cursor.rowcount > 0:
                self.connection.commit()
                cache.delete(f'contents_teacher_{teacher_id}')
                # FIXED: Clear all content type caches
                for type_id in range(0, 6):
                    cache.delete(f'contents_type_{type_id}')
                return True, "Content updated successfully!"
            else:
                return False, "Unsuccessful update"
        except Exception as e:
            return False, f"Database error: {e}"
    
    def hide_content(self, teacher_id: int, content_id: int, isHidden: bool):
        try:
            query = f"""UPDATE contents SET isHiddenFromStudents = %s WHERE TeacherID = %s AND ContentID = %s"""
            
            self.cursor.execute(query, (isHidden, teacher_id, content_id))
            if self.cursor.rowcount > 0:
                self.connection.commit()
                cache.delete(f'contents_teacher_{teacher_id}')
                # FIXED: Clear all content type caches
                for type_id in range(0, 6):
                    cache.delete(f'contents_type_{type_id}')
                statement = "is hidden to students" if isHidden else "is now shown to students"
                return True, f"Activity {statement}."
            else:
                print(f"No rows were updated for TeacherID: {teacher_id}. Check if the ID exists.")
        except Exception as e:
            return False, f"Database error: {e}"
            
    def create_tts_record(self, tts_id):
        try:
            query = f"""
                INSERT INTO tts_content(tts_id) VALUES(%s)
            """
            
            self.cursor.execute(query, (tts_id,))
            print(tts_id)
            self.connection.commit()
            return True, "Text-to-Speech added", tts_id
        except Exception as e:
            return False, f"Database error: {e}", None
    
    def update_tts_record(self, tts_id: int, audios):
        query = f"""UPDATE tts_content SET TTS_JSON = %s WHERE TTS_ID = %s"""
            
        try:
            self.cursor.execute(query, (audios, tts_id))
            if self.cursor.rowcount > 0:
                self.connection.commit()
                return True, "Audios for this content updated successfully!"
            else:
                return False, "Unsuccessful update"
        except Exception as e:
            return False, f"Database error: {e}"
            
    def get_or_create_attempt_activity(self, content_id, student_id):
        try:
            query_select = """
                SELECT AttemptID, Content_Answer FROM content_log_attempts
                WHERE ContentID = %s AND StudentID = %s AND status = 1
                ORDER BY AttemptID DESC LIMIT 1
            """
            
            self.cursor.execute(query_select, (content_id, student_id))
            result = self.cursor.fetchone()
            
            if result:
                attempt_id = result[0]
                saved_answer = result[1]
                return True, "Unfinished attempt found", attempt_id, saved_answer, True
            else:
                query_insert = """
                    INSERT INTO content_log_attempts(ContentID, StudentID, Score, status)
                    VALUES(%s, %s, 0, 2)
                """
                self.cursor.execute(query_insert, (content_id, student_id))
                self.connection.commit()
                attempt_id = self.cursor.lastrowid
                print("Inserted Attempt ID:", attempt_id)
                return True, "New attempt created", attempt_id, "{}", False
                    
        except Exception as e:
            return False, f"Database error: {e}", None, None, None

    def resume_attempt_activity(self, attempt_id):
        try:
            query = """
                UPDATE content_log_attempts 
                SET status = 2 
                WHERE AttemptID = %s
            """
            
            self.cursor.execute(query, (attempt_id,))
            self.connection.commit()
            rows_affected = self.cursor.rowcount
            
            if rows_affected > 0:
                return True, "Attempt resumed successfully"
            else:
                return False, "Attempt not found"
        except Exception as e:
            return False, f"Database error: {e}"
        
    def save_and_exit_activity(self, answer, attempt_id):
        try:
            query = """
                UPDATE content_log_attempts 
                SET Content_Answer = %s, status = 1 
                WHERE AttemptID = %s
            """
            
            self.cursor.execute(query, (answer, attempt_id))
            self.connection.commit()
            rows_affected = self.cursor.rowcount
            
            if rows_affected > 0:
                return True, "Progress saved."
            else:
                return False, "Attempt not found."
        except Exception as e:
            return False, f"Database error: {e}", None

    def finish_attempt_activity(self, answer, score, attempt_id):
        try:
            query = """
                UPDATE content_log_attempts 
                SET Content_Answer = %s, Score = %s, status = 3 
                WHERE AttemptID = %s
            """
            
            self.cursor.execute(query, (answer, score, attempt_id))
            self.connection.commit()
            rows_affected = self.cursor.rowcount
            
            if rows_affected > 0:
                return True, "Attempt finished successfully."
            else:
                return False, "Attempt not found."
        except Exception as e:
            return False, f"Database error: {e}"

    def get_or_create_attempt_assessment(self, assessment_id, student_id):
        try:
            query_select = """
                SELECT AttemptID, Assessment_Answer FROM assessment_log_attempts
                WHERE AssessmentID = %s AND StudentID = %s AND status = 1
                ORDER BY AttemptID DESC LIMIT 1
            """
            
            self.cursor.execute(query_select, (assessment_id, student_id))
            result = self.cursor.fetchone()
            
            if result:
                attempt_id = result[0]
                saved_answer = result[1]
                return True, "Unfinished attempt found", attempt_id, saved_answer, True
            else:
                query_insert = """
                    INSERT INTO assessment_log_attempts(AssessmentID, StudentID, Score, status)
                    VALUES(%s, %s, 0, 2)
                """
                self.cursor.execute(query_insert, (assessment_id, student_id))
                self.connection.commit()
                attempt_id = self.cursor.lastrowid
                return True, "New attempt created", attempt_id, "{}", False
                    
        except Exception as e:
            return False, f"Database error: {e}", None, None, None

    def resume_attempt_assessment(self, attempt_id):
        try:
            query = """
                UPDATE assessment_log_attempts 
                SET status = 2 
                WHERE AttemptID = %s
            """
            
            self.cursor.execute(query, (attempt_id,))
            self.connection.commit()
            rows_affected = self.cursor.rowcount
            
            if rows_affected > 0:
                return True, "Attempt resumed successfully"
            else:
                return False, "Attempt not found"
        except Exception as e:
            return False, f"Database error: {e}"
        
    def save_and_exit_assessment(self, answer, attempt_id):
        try:
            query = """
                UPDATE assessment_log_attempts 
                SET Assessment_Answer = %s, status = 1 
                WHERE AttemptID = %s
            """
            
            self.cursor.execute(query, (answer, attempt_id))
            self.connection.commit()
            rows_affected = self.cursor.rowcount
            
            if rows_affected > 0:
                return True, "Progress saved."
            else:
                return False, "Attempt not found."
        except Exception as e:
            return False, f"Database error: {e}", None

    def finish_attempt_assessment(self, answer, score, attempt_id):
        try:
            query = """
                UPDATE assessment_log_attempts 
                SET Assessment_Answer = %s, Score = %s, status = 3 
                WHERE AttemptID = %s
            """
            
            self.cursor.execute(query, (answer, score, attempt_id))
            self.connection.commit()
            rows_affected = self.cursor.rowcount
            
            if rows_affected > 0:
                return True, "Attempt finished successfully."
            else:
                return False, "Attempt not found."
        except Exception as e:
            return False, f"Database error: {e}"
    
    def get_student_progress_by_contents(self, teacher_id: int, content_type: int):
        try:
            query = f"""
                SELECT 
                c.ContentID,
                c.Content_Title,
                COUNT(DISTINCT cla.StudentID) AS completed_students,
                (SELECT COUNT(*) FROM students) AS total_students,
                CONCAT(
                    COUNT(DISTINCT cla.StudentID), '/',
                    (SELECT COUNT(*) FROM students)
                ) AS progress
                FROM contents c
                LEFT JOIN content_log_attempts cla ON cla.ContentID = c.ContentID
                WHERE c.TeacherID = %s AND c.ContentType = %s
                GROUP BY c.ContentID, c.Content_Title
                ORDER BY c.ContentID;
            """
            
            self.cursor.execute(query, (teacher_id, content_type))
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, f"Database error: {e}"

    def get_student_progress_by_assessments(self):
        try:
            query = f"""
                SELECT 
                a.AssessmentID,
                a.Assessment_Title,
                COUNT(DISTINCT ala.StudentID) AS completed_students,
                (SELECT COUNT(*) FROM students) AS total_students,
                CONCAT(
                    COUNT(DISTINCT ala.StudentID), '/',
                    (SELECT COUNT(*) FROM students)
                ) AS progress
                FROM assessments a
                LEFT JOIN assessment_log_attempts ala ON ala.AssessmentID = a.AssessmentID
                GROUP BY a.AssessmentID, a.Assessment_Title
                ORDER BY a.AssessmentID;
            """
            
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, f"Database error: {e}"
        
    def get_student_scores_by_content_id(self, content_id: int, section_id: int, filter: str):
        try:
            allowed_filters = [
                'StudentID DESC', 
                'StudentID ASC', 
                'highest_score DESC', 
                'lowest_score ASC', 
                'total_attempts DESC', 
                'total_attempts ASC'
            ]
            
            if filter not in allowed_filters:
                return False, "Invalid filter"
            
            query = f"""
                SELECT 
                    s.StudentID,
                    CONCAT(s.FirstName, ' ', s.LastName) AS StudentName,
                    COUNT(cla.AttemptID) AS total_attempts,
                    IFNULL(MAX(cla.Score), 0) AS highest_score,
                    IFNULL(MIN(cla.Score), 0) AS lowest_score,
                    c.TotalQuestions AS 'Total Questions'
                FROM students s
                LEFT JOIN content_log_attempts cla ON cla.StudentID = s.StudentID AND cla.ContentID = %s
                LEFT JOIN contents c ON c.ContentID = %s
                WHERE s.SectionID = %s
                GROUP BY s.StudentID
                ORDER BY {filter};
            """
            
            self.cursor.execute(query, (content_id, content_id, section_id))
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, f"Database error: {e}"
        
    def get_student_scores_by_assessment_id(self, assessment_id: int, section_id: int, filter: str):
        try:
            allowed_filters = [
                'StudentID DESC', 
                'StudentID ASC', 
                'highest_score DESC', 
                'lowest_score ASC', 
                'total_attempts DESC', 
                'total_attempts ASC'
            ]
            
            if filter not in allowed_filters:
                return False, "Invalid filter"
            
            query = f"""
                SELECT 
                    s.StudentID,
                    CONCAT(s.FirstName, ' ', s.LastName) AS StudentName,
                    COUNT(ala.AttemptID) AS total_attempts,
                    IFNULL(MAX(ala.Score), 0) AS highest_score,
                    IFNULL(MIN(ala.Score), 0) AS lowest_score,
                    a.TotalQuestions AS 'Total Questions'
                FROM students s
                LEFT JOIN assessment_log_attempts ala ON ala.StudentID = s.StudentID AND ala.AssessmentID = %s
                LEFT JOIN assessments a ON a.AssessmentID = %s
                WHERE s.SectionID = %s
                GROUP BY s.StudentID
                ORDER BY {filter};
            """
            
            self.cursor.execute(query, (assessment_id, assessment_id, section_id))
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, f"Database error: {e}"
        
    def get_student_activity_attempt_scores(self, student_id: int, content_id: int, filter: str):
        allowed_filters = [
            "Score ASC", 
            "Score DESC", 
            "attemptAt DESC", 
            "attemptAt ASC"
        ]
        
        if filter not in allowed_filters:
            return False, "Invalid filter"
        
        try:
            query = f"""
                SELECT 
                    ROW_NUMBER() OVER (PARTITION BY ContentID, StudentID ORDER BY attemptAt) AS attemptNumber,
                    Score,
                    AnswerStatusType,
                    attemptAt
                FROM content_log_attempts
                LEFT JOIN answerstatus ON status = AnswerStatusID
                WHERE StudentID = %s AND ContentID = %s
                ORDER BY {filter};
            """
            
            self.cursor.execute(query, (student_id, content_id))
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, f"Database error: {e}"
        
    def get_student_assessment_attempt_scores(self, student_id: int, assessment_id: int, filter: str):
        allowed_filters = [
            "Score ASC", 
            "Score DESC", 
            "attemptAt DESC", 
            "attemptAt ASC"
        ]
        
        if filter not in allowed_filters:
            return False, "Invalid filter"
        
        try:
            query = f"""
                SELECT 
                    ROW_NUMBER() OVER (PARTITION BY AssessmentID, StudentID ORDER BY attemptAt) AS attemptNumber,
                    Score,
                    AnswerStatusType,
                    attemptAt
                FROM assessment_log_attempts
                LEFT JOIN answerstatus ON status = AnswerStatusID
                WHERE StudentID = %s AND AssessmentID = %s
                ORDER BY {filter};
            """
            
            self.cursor.execute(query, (student_id, assessment_id))
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, f"Database error: {e}"
        
    def get_student_activity_attempt_choices(self, student_id: int):
        try:
            query = f"""
                SELECT 
                    attemptid,
                    score,
                    content_answer
                FROM content_log_attempts
                WHERE studentid = %s
                ORDER BY attemptAt DESC;
            """
            
            self.cursor.execute(query, (student_id,))
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, f"Database error: {e}"
        
    def get_content_answer(self, content_id: int):
        query = """
            SELECT 
                JSON_EXTRACT(content_details_json, '$[*].answer') as all_answers
            FROM contents
            WHERE contentid = %s
        """
        
        try:
            self.cursor.execute(query, (content_id,))
            results = self.cursor.fetchall()
            result = (True, results)
            # cache.set(cache_key, result, timeout=120) 
            return result
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def get_chat_history(self, teacher_id):
        try:
            get_convo = """SELECT CC_JSON FROM conversation WHERE CC_Teacher = %s"""
            
            self.cursor.execute(get_convo, (teacher_id,))
            result = self.cursor.fetchone()
            
            if result:
                return True, result[0] 
            else:
                return False, "{}"
        except Exception as e:
            return False, f"Database error: {e}"
        
    def chatbot_conversation_update(self, teacher_id, conversation):
        try:
            check_query = """SELECT CC_JSON FROM conversation WHERE CC_Teacher = %s"""
            self.cursor.execute(check_query, (teacher_id,))
            result = self.cursor.fetchone()
            
            if result is None:
                insert_query = """INSERT INTO conversation(CC_Teacher, CC_JSON) VALUES(%s, %s)"""
                self.cursor.execute(insert_query, (teacher_id, conversation))
                message = "record inserted"
            else:
                update_query = """UPDATE conversation SET CC_JSON = %s WHERE CC_Teacher = %s"""
                self.cursor.execute(update_query, (conversation, teacher_id))
                message = "record updated"
            
            self.connection.commit()
            return True, message    
        except Exception as e:
            return False, f"Database error: {e}"
    
    def get_achievements_by_student(self, student_id):
        try:
            query = """
                SELECT 
                    AchievementID,
                    earnedAt
                FROM achievement_tracker
                WHERE StudentID = %s
            """
            
            self.cursor.execute(query, (student_id,))
            results = self.cursor.fetchall()
            return True, results
        except Exception as e:
            return False, str(e)
    
    def get_count_finished_attempts_in_activity_and_assessment(self, student_id):
        try:
            query = """
                SELECT 
                    COUNT(*) as unique_finished_attempts
                FROM (
                    SELECT 
                        StudentID,
                        ContentID,
                        MIN(AttemptID) as first_attempt
                    FROM content_log_attempts
                    WHERE status = 3
                    GROUP BY StudentID, ContentID
                    
                    UNION ALL
                    
                    SELECT 
                        StudentID,
                        AssessmentID,
                        MIN(AttemptID) as first_attempt
                    FROM assessment_log_attempts
                    WHERE status = 3
                    GROUP BY StudentID, AssessmentID
                ) AS first_attempts
                WHERE StudentID = %s
                GROUP BY StudentID;
            """
            
            self.cursor.execute(query, (student_id,))
            count = self.cursor.fetchone()
            
            if count[0]:
                return True, count[0]
        except Exception as e:
            return False, str(e)
        
    def get_first_attempt_in_activity(self, student_id):
        try:
            query = """
                SELECT AttemptID FROM content_log_attempts
                WHERE StudentID = %s
                LIMIT 1;
            """
            
            self.cursor.execute(query, (student_id,))
            row = self.cursor.fetchone()
            
            if row[0]:
                return True, row[0]
            else:
                return False, None
        except Exception as e:
            return False, str(e)
        
    def get_first_attempt_in_assessment(self, student_id):
        try:
            query = """
                SELECT * FROM assessment_log_attempts
                WHERE StudentID = %s
                LIMIT 1;
            """
            
            self.cursor.execute(query, (student_id,))
            count = self.cursor.fetchone()
            
            if count[0]:
                return True, count[0]
            else:
                return False, None
        except Exception as e:
            return False, str(e)
        
    def get_perfect_scores(self, student_id):
        try:
            query = """
                SELECT COUNT(*) AS perfect_score
                FROM (
                    SELECT cla.StudentID, cla.ContentID, cla.Score, c.TotalQuestions FROM content_log_attempts as cla
                    LEFT JOIN contents as c ON cla.ContentID = c.ContentID
                    WHERE cla.Score = c.TotalQuestions AND cla.StudentID = %s
                    GROUP BY cla.StudentID, cla.ContentID

                    UNION ALL

                    SELECT ala.StudentID, ala.AssessmentID, ala.Score, a.TotalQuestions FROM assessment_log_attempts as ala
                    LEFT JOIN assessments as a ON ala.AssessmentID = a.AssessmentID
                    WHERE ala.Score = a.TotalQuestions AND ala.StudentID = %s
                    GROUP BY ala.StudentID, ala.AssessmentID
                ) AS perfect_scores
                WHERE StudentID = %s;
            """
            
            self.cursor.execute(query, (student_id, student_id, student_id))
            count = self.cursor.fetchone()
            
            if count[0]:
                return True, count[0]
            else:
                return False, None
        except Exception as e:
            return False, str(e)
        
    def insert_achievement_for_student(self, student_id, achievement_id):
        try:
            query = """INSERT INTO achievement_tracker(StudentID, AchievementID) VALUES (%s, %s);"""
            
            self.cursor.execute(query, (student_id, achievement_id))
            rows_affected = self.cursor.rowcount
            self.connection.commit()
            
            if rows_affected > 0:
                return True, "Goal achieved"
        except Exception as e:
            return False, str(e)        
        
    def has_achievement(self, student_id, achievement_id):
        try:
            query = """SELECT StudentID FROM achievement_tracker WHERE StudentID = %s and AchievementID = %s;"""
            
            self.cursor.execute(query, (student_id, achievement_id))
            result = self.cursor.fetchone()
            
            return True if result is not None else False
            
        except Exception as e:
            return False, str(e)
        
    def get_section(self):
        try:
            query = """SELECT S_ID, S_Names, S_Grade FROM section"""
            
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            return results
        except Exception as e:
            return False, str(e)
    
    def insert_section(self, section_name):
        try:
            query = """INSERT INTO section(S_Names) VALUES (%s)"""
            
            self.cursor.execute(query, (section_name,))
            self.connection.commit()
            return True, "Section inserted successfully."
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def update_section(self, section_id, section_name):
        try:
            query = """UPDATE section SET S_Names = %s WHERE S_ID = %s"""
            
            self.cursor.execute(query, (section_name, section_id))
            self.connection.commit()
            return True, "Section updated successfully."
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def delete_section(self, section_id):
        try:
            query = """DELETE FROM section WHERE S_ID = %s"""
            
            self.cursor.execute(query, (section_id,))
            self.connection.commit()
            return True, "Section deleted successfully."
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def assign_section_to_teacher(self, teacher_id, section_json):
        try:
            query = """UPDATE teachers SET assigned_sections = %s WHERE TeacherID = %s"""
            
            self.cursor.execute(query, (section_json, teacher_id))
            self.connection.commit()
            return True, "Section/s assigned to teacher successfully."
        except Exception as e:
            self.connection.rollback() 
            return False, str(e)
        
    def get_assigned_sections_of_teacher(self, teacher_id):
        try:
            query = """SELECT assigned_sections FROM teachers WHERE TeacherID = %s"""
            
            self.cursor.execute(query, (teacher_id,))
            result = self.cursor.fetchone()
            return True, result[0] if result else "[]"
        except Exception as e:
            return False, str(e)