package com.example.data

import android.content.Context
import androidx.room.*
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

// ==========================================
// 1. Entities
// ==========================================

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String, // Firebase UID or local ID
    val name: String,
    val email: String,
    val phone: String,
    val school: String,
    val college: String,
    val courseBranch: String,
    val year: String,
    val city: String,
    val skills: String, // Comma separated
    val linksPortfolio: String,
    val linksLinkedIn: String,
    val linksGitHub: String,
    val bio: String,
    val xpPoints: Int = 100,
    val avatarUrl: String = ""
)

@Entity(tableName = "follows", primaryKeys = ["followerId", "followingId"])
data class FollowEntity(
    val followerId: String,
    val followingId: String
)

@Entity(tableName = "posts")
data class PostEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val authorId: String,
    val authorName: String,
    val authorAvatar: String,
    val content: String,
    val mediaUrl: String,
    val createdAt: Long = System.currentTimeMillis(),
    val isFeatured: Boolean = false,
    val likeCount: Int = 0,
    val commentCount: Int = 0
)

@Entity(tableName = "post_likes", primaryKeys = ["postId", "userId"])
data class PostLikeEntity(
    val postId: Int,
    val userId: String
)

@Entity(tableName = "post_comments")
data class PostCommentEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val postId: Int,
    val userId: String,
    val userName: String,
    val userAvatar: String,
    val commentText: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "scholarships")
data class ScholarshipEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val eligibility: String,
    val applyUrl: String,
    val deadline: String,
    val status: String, // "LIVE", "COMING_SOON"
    val logoUrl: String = "",
    val isTopBanner: Boolean = false
)

@Entity(tableName = "courses")
data class CourseEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val status: String, // "COMING_SOON", "LIVE"
    val duration: String,
    val level: String
)

@Entity(tableName = "jobs")
data class JobEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val type: String, // "Full-Time", "Internship", "Part-Time", "Placement Request"
    val company: String,
    val location: String,
    val description: String,
    val salary: String,
    val applyUrl: String,
    val status: String // "LIVE", "PENDING"
)

@Entity(tableName = "gigs")
data class GigEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val price: Int,
    val deadline: String,
    val deliverables: String,
    val status: String // "LIVE", "CLOSED"
)

@Entity(tableName = "events")
data class EventEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val type: String, // "Webinar", "Workshop", "Hackathon", "Buildathon" etc.
    val date: String,
    val price: Int,
    val description: String,
    val tutorNames: String,
    val isLive: Boolean = true,
    val upiId: String = "9778329167@ibl"
)

@Entity(tableName = "event_registrations")
data class EventRegistrationEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val eventId: Int,
    val userId: String,
    val upiTxnId: String,
    val paymentStatus: String, // "Pending Verification", "Confirmed", "Rejected"
    val screenshotPath: String = "",
    val name: String,
    val email: String,
    val phone: String
)

@Entity(tableName = "communities")
data class CommunityEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val description: String,
    val isPaid: Boolean,
    val price: Int,
    val memberCount: Int = 1,
    val coverImage: String = ""
)

@Entity(tableName = "community_members", primaryKeys = ["communityId", "userId"])
data class CommunityMemberEntity(
    val communityId: Int,
    val userId: String
)

@Entity(tableName = "badges")
data class BadgeEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val description: String,
    val iconName: String,
    val criteria: String
)

@Entity(tableName = "user_badges", primaryKeys = ["userId", "badgeId"])
data class UserBadgeEntity(
    val userId: String,
    val badgeId: Int
)

@Entity(tableName = "platform_stats")
data class PlatformStatEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val metricName: String,
    val metricValue: String
)


// ==========================================
// 2. DAOs
// ==========================================

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    fun getUserByIdFlow(id: String): Flow<UserEntity?>

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    suspend fun getUserById(id: String): UserEntity?

    @Query("SELECT * FROM users")
    fun getAllUsersFlow(): Flow<List<UserEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Update
    suspend fun updateUser(user: UserEntity)
}

@Dao
interface FollowDao {
    @Query("SELECT COUNT(*) FROM follows WHERE followerId = :userId")
    fun getFollowingCountFlow(userId: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM follows WHERE followingId = :userId")
    fun getFollowersCountFlow(userId: String): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun followUser(follow: FollowEntity)

    @Query("DELETE FROM follows WHERE followerId = :followerId AND followingId = :followingId")
    suspend fun unfollowUser(followerId: String, followingId: String)
}

@Dao
interface PostDao {
    @Query("SELECT * FROM posts ORDER BY createdAt DESC")
    fun getPostsFlow(): Flow<List<PostEntity>>

    @Query("SELECT * FROM posts WHERE isFeatured = 1 LIMIT 1")
    fun getFeaturedPostFlow(): Flow<PostEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPost(post: PostEntity)

    @Query("UPDATE posts SET likeCount = likeCount + 1 WHERE id = :postId")
    suspend fun incrementLikeCount(postId: Int)

    @Query("UPDATE posts SET likeCount = max(0, likeCount - 1) WHERE id = :postId")
    suspend fun decrementLikeCount(postId: Int)
}

@Dao
interface PostLikeDao {
    @Query("SELECT EXISTS(SELECT 1 FROM post_likes WHERE postId = :postId AND userId = :userId)")
    fun hasLikedFlow(postId: Int, userId: String): Flow<Boolean>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertLike(like: PostLikeEntity)

    @Query("DELETE FROM post_likes WHERE postId = :postId AND userId = :userId")
    suspend fun deleteLike(postId: Int, userId: String)
}

@Dao
interface PostCommentDao {
    @Query("SELECT * FROM post_comments WHERE postId = :postId ORDER BY createdAt ASC")
    fun getCommentsForPostFlow(postId: Int): Flow<List<PostCommentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertComment(comment: PostCommentEntity)
}

@Dao
interface ScholarshipDao {
    @Query("SELECT * FROM scholarships ORDER BY deadline ASC")
    fun getAllScholarshipsFlow(): Flow<List<ScholarshipEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScholarship(scholarship: ScholarshipEntity)
}

@Dao
interface CourseDao {
    @Query("SELECT * FROM courses")
    fun getAllCoursesFlow(): Flow<List<CourseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCourse(course: CourseEntity)
}

@Dao
interface JobDao {
    @Query("SELECT * FROM jobs ORDER BY id DESC")
    fun getAllJobsFlow(): Flow<List<JobEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJob(job: JobEntity)
}

@Dao
interface GigDao {
    @Query("SELECT * FROM gigs WHERE status = 'LIVE' ORDER BY id DESC")
    fun getAllGigsFlow(): Flow<List<GigEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGig(gig: GigEntity)
}

@Dao
interface EventDao {
    @Query("SELECT * FROM events")
    fun getAllEventsFlow(): Flow<List<EventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: EventEntity)
}

@Dao
interface EventRegistrationDao {
    @Query("SELECT * FROM event_registrations WHERE userId = :userId")
    fun getRegistrationsForUserFlow(userId: String): Flow<List<EventRegistrationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRegistration(registration: EventRegistrationEntity)

    @Query("SELECT COUNT(*) FROM event_registrations WHERE userId = :userId AND paymentStatus = 'Confirmed'")
    fun getConfirmedEventCountFlow(userId: String): Flow<Int>
}

@Dao
interface CommunityDao {
    @Query("SELECT * FROM communities")
    fun getAllCommunitiesFlow(): Flow<List<CommunityEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCommunity(community: CommunityEntity)
}

@Dao
interface PlatformStatDao {
    @Query("SELECT * FROM platform_stats")
    fun getAllStatsFlow(): Flow<List<PlatformStatEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStat(stat: PlatformStatEntity)
}

@Dao
interface BadgeDao {
    @Query("SELECT * FROM badges")
    fun getAllBadgesFlow(): Flow<List<BadgeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBadge(badge: BadgeEntity)
}


// ==========================================
// 3. Database
// ==========================================

@Database(
    entities = [
        UserEntity::class,
        FollowEntity::class,
        PostEntity::class,
        PostLikeEntity::class,
        PostCommentEntity::class,
        ScholarshipEntity::class,
        CourseEntity::class,
        JobEntity::class,
        GigEntity::class,
        EventEntity::class,
        EventRegistrationEntity::class,
        CommunityEntity::class,
        CommunityMemberEntity::class,
        BadgeEntity::class,
        UserBadgeEntity::class,
        PlatformStatEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun userDao(): UserDao
    abstract fun followDao(): FollowDao
    abstract fun postDao(): PostDao
    abstract fun postLikeDao(): PostLikeDao
    abstract fun postCommentDao(): PostCommentDao
    abstract fun scholarshipDao(): ScholarshipDao
    abstract fun courseDao(): CourseDao
    abstract fun jobDao(): JobDao
    abstract fun gigDao(): GigDao
    abstract fun eventDao(): EventDao
    abstract fun eventRegistrationDao(): EventRegistrationDao
    abstract fun communityDao(): CommunityDao
    abstract fun platformStatDao(): PlatformStatDao
    abstract fun badgeDao(): BadgeDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "chavee_database"
                )
                    .addCallback(DatabaseCallback(context))
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }

    private class DatabaseCallback(
        private val context: Context
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                CoroutineScope(Dispatchers.IO).launch {
                    prepopulateData(database)
                }
            }
        }

        private suspend fun prepopulateData(db: AppDatabase) {
            // Pre-populate Platform Stats (Today's Highlights)
            db.platformStatDao().insertStat(PlatformStatEntity(metricName = "App Installs", metricValue = "12,400+"))
            db.platformStatDao().insertStat(PlatformStatEntity(metricName = "Students Joined", metricValue = "3,200+"))
            db.platformStatDao().insertStat(PlatformStatEntity(metricName = "Campus Ambassadors", metricValue = "150+"))

            // Pre-populate Mock Users
            val adminId = "admin_user_id"
            val student1Id = "student_1"
            val student2Id = "student_2"

            db.userDao().insertUser(
                UserEntity(
                    id = adminId,
                    name = "Chavee Team",
                    email = "admin@chavee.com",
                    phone = "9778329167",
                    school = "N/A",
                    college = "Admin HQ",
                    courseBranch = "All Fields",
                    year = "2026",
                    city = "Bengaluru",
                    skills = "Mentorship, Career Guidance, Event Planning",
                    linksPortfolio = "https://chavee.com",
                    linksLinkedIn = "",
                    linksGitHub = "",
                    bio = "Connecting and empowering Indian students with learning and job opportunities.",
                    xpPoints = 1000,
                    avatarUrl = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120"
                )
            )

            db.userDao().insertUser(
                UserEntity(
                    id = student1Id,
                    name = "Aarav Sharma",
                    email = "aarav@gmail.com",
                    phone = "9876543210",
                    school = "Engineering",
                    college = "IIT Madras",
                    courseBranch = "Computer Science",
                    year = "3rd Year",
                    city = "Chennai",
                    skills = "Kotlin, Jetpack Compose, UX Design",
                    linksPortfolio = "https://aarav.dev",
                    linksLinkedIn = "https://linkedin.com/in/aarav",
                    linksGitHub = "https://github.com/aarav",
                    bio = "Enthusiastic Android Developer looking for internships!",
                    xpPoints = 450,
                    avatarUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120"
                )
            )

            db.userDao().insertUser(
                UserEntity(
                    id = student2Id,
                    name = "Priya Patel",
                    email = "priya@gmail.com",
                    phone = "8765432109",
                    school = "Commerce",
                    college = "SRCC Delhi",
                    courseBranch = "B.Com",
                    year = "2nd Year",
                    city = "New Delhi",
                    skills = "Finance, Excel, Content Writing",
                    linksPortfolio = "",
                    linksLinkedIn = "https://linkedin.com/in/priya",
                    linksGitHub = "",
                    bio = "Aspiring financial analyst and occasional blogger.",
                    xpPoints = 280,
                    avatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
                )
            )

            // Follows
            db.followDao().followUser(FollowEntity(followerId = student1Id, followingId = adminId))
            db.followDao().followUser(FollowEntity(followerId = student2Id, followingId = adminId))

            // Pre-populate Post of the Day (featured = true)
            db.postDao().insertPost(
                PostEntity(
                    id = 1,
                    authorId = adminId,
                    authorName = "Chavee Team",
                    authorAvatar = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120",
                    content = "🔥 Welcome to CHAVEE! 🚀 We're thrilled to launch India's complete student ecosystem. From language courses (German, Korean!) and top scholarships to freelance gigs and free student communities, we've got you covered. Dive in, connect with fellow students, and start building your future today! Check out our Korean Language workshop coming up soon on July 29th!",
                    mediaUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
                    isFeatured = true,
                    likeCount = 142,
                    commentCount = 12
                )
            )

            // Main Feed Posts
            db.postDao().insertPost(
                PostEntity(
                    id = 2,
                    authorId = student1Id,
                    authorName = "Aarav Sharma",
                    authorAvatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120",
                    content = "Just finished building the first version of my personal finance tracking app using Jetpack Compose! It supports material widgets, custom animations, and clean offline storage. Let me know if anyone wants to collaborate on building a StudySync feature for Chavee!",
                    mediaUrl = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
                    isFeatured = false,
                    likeCount = 54,
                    commentCount = 5
                )
            )

            db.postDao().insertPost(
                PostEntity(
                    id = 3,
                    authorId = student2Id,
                    authorName = "Priya Patel",
                    authorAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
                    content = "Hey everyone! 👋 Has anyone applied for the Reliance Foundation Scholarship? I am preparing the essay questions and would love to review each other's submissions. Let's form a study group in the Communities tab!",
                    mediaUrl = "",
                    isFeatured = false,
                    likeCount = 38,
                    commentCount = 8
                )
            )

            // Comments
            db.postCommentDao().insertComment(PostCommentEntity(postId = 1, userId = student1Id, userName = "Aarav Sharma", userAvatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120", commentText = "This is a stellar initiative! Count me in for the Korean language workshop on July 29th."))
            db.postCommentDao().insertComment(PostCommentEntity(postId = 1, userId = student2Id, userName = "Priya Patel", userAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120", commentText = "Chavee is exactly what we needed to keep track of career updates and study networks."))

            // Scholarships
            db.scholarshipDao().insertScholarship(
                ScholarshipEntity(
                    id = 1,
                    title = "Reliance Foundation Scholarship 2026",
                    description = "The Reliance Foundation Undergraduate Scholarships support meritorious students from all corners of India to pursue their education in any stream. Aiming to support up to 5,000 undergraduate students, the scholarship provides financial support up to ₹2 Lakhs along with strong leadership mentoring.",
                    eligibility = "Undergraduate students enrolled in 1st year degree program. Annual family income less than ₹15 Lakhs. Minimum 60% in Class 12.",
                    applyUrl = "https://www.reliancefoundation.org/scholarships",
                    deadline = "31 Aug 2026",
                    status = "LIVE",
                    logoUrl = "https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&q=80&w=120",
                    isTopBanner = true
                )
            )

            db.scholarshipDao().insertScholarship(
                ScholarshipEntity(
                    id = 2,
                    title = "Aditya Birla Scholarship Program",
                    description = "A highly prestigious scholarship for students of elite institutions (IITs, IIMs, XLRI, BITS Pilani, Law Colleges) to support their professional academic journey with high financial coverage.",
                    eligibility = "Top 25% students of respective partner institutes across Engineering, Management, and Law streams.",
                    applyUrl = "https://www.adityabirlascholars.net",
                    deadline = "15 Sep 2026",
                    status = "LIVE",
                    logoUrl = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=120",
                    isTopBanner = false
                )
            )

            db.scholarshipDao().insertScholarship(
                ScholarshipEntity(
                    id = 3,
                    title = "Tata Trust Medical and Healthcare Scholarship",
                    description = "Supports students pursuing undergraduate or postgraduate programs in medicine, healthcare, nursing, and pharmacy across top healthcare colleges in India.",
                    eligibility = "Students pursuing MBBS, BDS, Nursing, or Pharmacy programs. Good academic track record.",
                    applyUrl = "https://www.tatatrusts.org",
                    deadline = "30 Sep 2026",
                    status = "COMING_SOON",
                    logoUrl = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=120",
                    isTopBanner = false
                )
            )

            // Courses
            db.courseDao().insertCourse(CourseEntity(id = 1, title = "German Language Course (A1)", description = "Master essential conversational German, basic vocabulary, grammar, and pronunciation. Guided by certified language experts, perfect for study-abroad preparation.", status = "COMING_SOON", duration = "8 Weeks", level = "Beginner"))
            db.courseDao().insertCourse(CourseEntity(id = 2, title = "Korean Language Course (Basic)", description = "Learn Hangul script, basic daily communication, Korean culture guidelines, and vocabulary to kickstart your travel or learning journey.", status = "COMING_SOON", duration = "6 Weeks", level = "Beginner"))
            db.courseDao().insertCourse(CourseEntity(id = 3, title = "Tech Communication & Soft Skills", description = "Acquire high-impact technical communication, professional resume writing, LinkedIn positioning, and pitch-deck speaking techniques.", status = "COMING_SOON", duration = "4 Weeks", level = "Intermediate"))

            // Jobs
            db.jobDao().insertJob(JobEntity(id = 1, title = "Junior Android Developer", type = "Full-Time", company = "TechVantage Solutions", location = "Bengaluru", description = "We are seeking a junior Kotlin developer with a strong passion for Jetpack Compose and clean architecture. You'll build feature modules for our consumer finance app.", salary = "₹6 - 8 LPA", applyUrl = "https://techvantage.com/careers", status = "LIVE"))
            db.jobDao().insertJob(JobEntity(id = 2, title = "Product Design Intern", type = "Internship", company = "DesignWave Labs", location = "Remote", description = "Collaborate with our product and engineering teams to design interactive wireframes, user flows, and Material 3 components using Figma.", salary = "₹15,000 / month", applyUrl = "https://designwave.com/careers", status = "LIVE"))
            db.jobDao().insertJob(JobEntity(id = 3, title = "Campus Ambassador Lead", type = "Part-Time", company = "Chavee Team", location = "On-Campus (Various)", description = "Lead student engagement and promote professional courses, scholarship calendars, and freelance events in your campus college network.", salary = "₹5,000 / month + Incentives", applyUrl = "https://chavee.com", status = "LIVE"))

            // Gigs
            db.gigDao().insertGig(GigEntity(id = 1, title = "Design a Mobile App UI landing page", description = "Create a modern landing page wireframe and interactive prototypes in Figma using Material Design 3 guidelines.", price = 3000, deadline = "15 July 2026", deliverables = "Figma file containing Desktop & Mobile viewport layouts, custom icons, and interactive components.", status = "LIVE"))
            db.gigDao().insertGig(GigEntity(id = 2, title = "Write 5 Articles on Career Paths in India", description = "Produce engaging, highly researched articles (1,200 words each) on emerging job fields for engineering and commerce students in India.", price = 2500, deadline = "18 July 2026", deliverables = "Google Docs folder containing 5 SEO-optimized markdown articles.", status = "LIVE"))

            // Events
            db.eventDao().insertEvent(
                EventEntity(
                    id = 1,
                    title = "Korean Language Workshop",
                    type = "Webinar",
                    date = "29 July",
                    price = 49,
                    description = "Join our exclusive introductory workshop on Korean Language (Hangul) led by elite native instructors Leehand and April Kim! Learn Hangul basics, key phrases, cultural etiquettes, and receive free worksheets to jumpstart your bilingual career path. Safe UPI payment of ₹49.",
                    tutorNames = "Leehand and April Kim",
                    isLive = true
                )
            )

            // Communities
            db.communityDao().insertCommunity(CommunityEntity(id = 1, name = "Chavee Language Enthusiasts", description = "A lively community for students learning German, Korean, French, or Japanese. Join language partner rooms, participate in speaking audio challenges, and access high-quality worksheets.", isPaid = false, price = 0, memberCount = 412, coverImage = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400"))
            db.communityDao().insertCommunity(CommunityEntity(id = 2, name = "India Developer Network", description = "Connecting aspiring software engineers, web developers, and mobile builders. Share projects, secure code reviews, and partner up for upcoming national hackathons.", isPaid = false, price = 0, memberCount = 680, coverImage = "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=400"))
            db.communityDao().insertCommunity(CommunityEntity(id = 3, name = "Premium Mentorship Circle", description = "Direct 1-on-1 monthly sessions with expert campus ambassadors, premium recruiters, and resume reviewers from top-tier firms. Exclusive access to live job referral boards.", isPaid = true, price = 199, memberCount = 85, coverImage = "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400"))

            // Badges
            db.badgeDao().insertBadge(BadgeEntity(id = 1, name = "Early Adopter", description = "Joined Chavee platform during launching phase", iconName = "ic_badge_rocket", criteria = "Join App"))
            db.badgeDao().insertBadge(BadgeEntity(id = 2, name = "First Gig", description = "Apply and complete your first freelance gig", iconName = "ic_badge_work", criteria = "Complete 1 Gig"))
            db.badgeDao().insertBadge(BadgeEntity(id = 3, name = "Community Builder", description = "Create or join three student communities", iconName = "ic_badge_people", criteria = "Join 3 Communities"))
        }
    }
}
