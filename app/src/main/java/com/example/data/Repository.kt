package com.example.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

class ChaveeRepository(private val db: AppDatabase) {

    // Users
    fun getUserFlow(userId: String): Flow<UserEntity?> = db.userDao().getUserByIdFlow(userId)
    suspend fun getUser(userId: String): UserEntity? = db.userDao().getUserById(userId)
    suspend fun saveUser(user: UserEntity) = db.userDao().insertUser(user)
    suspend fun updateUser(user: UserEntity) = db.userDao().updateUser(user)

    // Follows
    fun getFollowersCount(userId: String): Flow<Int> = db.followDao().getFollowersCountFlow(userId)
    fun getFollowingCount(userId: String): Flow<Int> = db.followDao().getFollowingCountFlow(userId)
    suspend fun followUser(followerId: String, followingId: String) {
        db.followDao().followUser(FollowEntity(followerId, followingId))
    }
    suspend fun unfollowUser(followerId: String, followingId: String) {
        db.followDao().unfollowUser(followerId, followingId)
    }

    // Posts & Comments
    val postsFlow: Flow<List<PostEntity>> = db.postDao().getPostsFlow()
    val featuredPostFlow: Flow<PostEntity?> = db.postDao().getFeaturedPostFlow()

    suspend fun insertPost(post: PostEntity) = db.postDao().insertPost(post)

    fun hasLikedPost(postId: Int, userId: String): Flow<Boolean> = db.postLikeDao().hasLikedFlow(postId, userId)
    suspend fun toggleLikePost(postId: Int, userId: String, isLiked: Boolean) {
        if (isLiked) {
            db.postLikeDao().deleteLike(postId, userId)
            db.postDao().decrementLikeCount(postId)
        } else {
            db.postLikeDao().insertLike(PostLikeEntity(postId, userId))
            db.postDao().incrementLikeCount(postId)
        }
    }

    fun getComments(postId: Int): Flow<List<PostCommentEntity>> = db.postCommentDao().getCommentsForPostFlow(postId)
    suspend fun addComment(comment: PostCommentEntity) = db.postCommentDao().insertComment(comment)

    // Scholarships
    val scholarshipsFlow: Flow<List<ScholarshipEntity>> = db.scholarshipDao().getAllScholarshipsFlow()
    suspend fun addScholarship(scholarship: ScholarshipEntity) = db.scholarshipDao().insertScholarship(scholarship)

    // Courses
    val coursesFlow: Flow<List<CourseEntity>> = db.courseDao().getAllCoursesFlow()
    suspend fun addCourse(course: CourseEntity) = db.courseDao().insertCourse(course)

    // Jobs
    val jobsFlow: Flow<List<JobEntity>> = db.jobDao().getAllJobsFlow()
    suspend fun addJob(job: JobEntity) = db.jobDao().insertJob(job)

    // Gigs
    val gigsFlow: Flow<List<GigEntity>> = db.gigDao().getAllGigsFlow()
    suspend fun addGig(gig: GigEntity) = db.gigDao().insertGig(gig)

    // Events
    val eventsFlow: Flow<List<EventEntity>> = db.eventDao().getAllEventsFlow()
    suspend fun addEvent(event: EventEntity) = db.eventDao().insertEvent(event)

    // Registrations
    fun getRegistrations(userId: String): Flow<List<EventRegistrationEntity>> = db.eventRegistrationDao().getRegistrationsForUserFlow(userId)
    fun getConfirmedEventCount(userId: String): Flow<Int> = db.eventRegistrationDao().getConfirmedEventCountFlow(userId)
    suspend fun registerForEvent(registration: EventRegistrationEntity) = db.eventRegistrationDao().insertRegistration(registration)

    // Communities
    val communitiesFlow: Flow<List<CommunityEntity>> = db.communityDao().getAllCommunitiesFlow()
    suspend fun addCommunity(community: CommunityEntity) = db.communityDao().insertCommunity(community)

    // Stats
    val statsFlow: Flow<List<PlatformStatEntity>> = db.platformStatDao().getAllStatsFlow()
    suspend fun saveStat(stat: PlatformStatEntity) = db.platformStatDao().insertStat(stat)

    // Badges
    val badgesFlow: Flow<List<BadgeEntity>> = db.badgeDao().getAllBadgesFlow()
}
