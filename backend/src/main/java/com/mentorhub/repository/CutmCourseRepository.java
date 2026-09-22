package com.mentorhub.repository;

import com.mentorhub.model.CutmCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CutmCourseRepository extends JpaRepository<CutmCourse, Long> {

    List<CutmCourse> findByBasketCategoryOrderByCourseCodeAsc(String basketCategory);

    List<CutmCourse> findByCourseCategoryIgnoreCaseOrderByCourseCodeAsc(String courseCategory);

    List<CutmCourse> findByFacultyContainingIgnoreCaseOrderByCourseCodeAsc(String faculty);

    Optional<CutmCourse> findByCourseCodeIgnoreCase(String courseCode);

    Optional<CutmCourse> findByCoursewareId(Long coursewareId);

    List<CutmCourse> findByDepartmentContainingIgnoreCase(String department);

    @Query("SELECT c FROM CutmCourse c WHERE " +
           "LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.courseTitle) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.faculty) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.courseCategory) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.basketName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.department) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY c.courseCode ASC")
    List<CutmCourse> searchCourses(@Param("query") String query);
}
