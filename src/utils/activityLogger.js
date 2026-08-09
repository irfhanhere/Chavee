import { supabase } from '../supabaseClient.js';

/**
 * Logs a user action into the user_activity table.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} activityType - The type of activity (e.g., 'community_join', 'job_application', 'post_like').
 * @param {object} metadata - Additional data related to the activity (e.g., { community_id, community_name }).
 */
export async function logUserActivity(userId, activityType, metadata = {}) {
    if (!userId || !activityType) return;
    
    try {
        console.log('DEBUG user_activity insert payload:', { table: 'user_activity', values: { user_id: userId, activity_type: activityType, metadata } });
        const { error } = await supabase
            .from('user_activity')
            .insert({
                user_id: userId,
                activity_type: activityType,
                metadata: metadata,
            });

        if (error) {
            console.error('Failed to log user activity:', { message: error.message, code: error.code, details: error.details, hint: error.hint, full: error });
        }
    } catch (err) {
        console.error('Error logging user activity:', { message: err.message, code: err.code, details: err.details, hint: err.hint, full: err });
    }
}
