/*
================================================================================
SYDNEY TRAINS GRAFFITI REPORTING DATA PIPELINE
================================================================================
This script creates reporting tables and views for Sydney Trains graffiti data
processing and management. It includes multiple data transformation stages:

1. Graffiti Data Views (commented out - definitions preserved)
2. Front of Train Data Views (commented out - definitions preserved) 
3. Start/End Task Views (commented out - definitions preserved)
4. Task Headers and Results Views (commented out - definitions preserved)
5. Staging Table Creation and Population
6. Final Table Promotion (Atomic Swap)
7. Cleanup and Maintenance

Last Updated: Current timestamp tracking included
================================================================================
*/

-- =============================================================================
-- SECTION 1: COMMENTED VIEW DEFINITIONS (PRESERVED FOR REFERENCE)
-- =============================================================================

/* 
VIEW: reporting_data.view_sydney_trains_graffiti_start_end_tasks
PURPOSE: Tracks start and end times for graffiti cleaning tasks with work hours calculation
FEATURES: Time extraction, work hour calculation, image URL generation, task ordering
*/
/*
DROP VIEW reporting_data.view_sydney_trains_graffiti_start_end_tasks;
CREATE OR REPLACE VIEW reporting_data.view_sydney_trains_graffiti_start_end_tasks AS
select  
    start_time::timestamp without time zone "start_time", 
    to_char(start_time,'YYYY-MM-DD')::date "start_time_day", 
    to_char(start_time,'YYYY-MM-01')::date "start_time_month", 
    to_char(start_time,'YYYY-01-01')::date "start_time_year", 
    end_time::timestamp without time zone "end_time", 
    to_char(end_time,'YYYY-MM-DD')::date "end_time_day", 
    to_char(end_time,'YYYY-MM-01')::date "end_time_month", 
    to_char(end_time,'YYYY-01-01')::date "end_time_year", 
    CASE WHEN start_time::timestamp without time zone IS NOT NULL 
         AND end_time::timestamp without time zone IS NOT NULL 
         and start_time::timestamp without time zone <= end_time::timestamp without time zone  
         THEN EXTRACT(EPOCH FROM end_time::timestamp without time zone-start_time::timestamp without time zone)/3600.0 
         ELSE NULL 
    END AS "WorkHours",   
    detail."post_id",    
    CONCAT(detail."task_name",' - ',UPPER(detail."adj_detail_name")) as "adj_detail_name",   
    detail."Result",      
    detail.workflow_name,   
    ROW_NUMBER() OVER (order by "post_id", "adj_order") as "Index",     
    CONCAT('https://client.ums.com.au/jobs/',"post_id",'/') as "URL",     
    start_task_image."URL" as "Start_URL",     
    end_task_image."URL" as "End_URL",     
    acs_task_image."URL" as "ACS_URL",     
    "Corridor",     
    "Status",     
    "key",         
    DENSE_RANK() OVER (ORDER BY start_time::timestamp without time zone, "key") as "Task_Ord",     
    DENSE_RANK() OVER (PARTITION BY detail."post_id" ORDER BY start_time::timestamp without time zone, "key") as "Task_Ord_Disp"      
FROM (               
    select "start_time",             
        "end_time",             
        "start_json",             
        "end_json",             
        "acs_json",             
        "key",                 
        post_id,             
        post_date,                     
        external_ref_id,                    
        "Corridor",             
        "task_name",                        
        "adj_order",                       
        "adj_detail_name",             
        "workflow_name",             
        --"Images",             
        CASE WHEN MAX("Result") ~ '^\d+ file\(s\)$' 
             THEN CONCAT('Photos - ',SUM(NULLIF(REGEXP_REPLACE(CASE WHEN "Result" ~ '^\d+ file\(s\)$' THEN "Result" ELSE NULL END,'[^\d]+',''),'')::int)) 
             ELSE STRING_AGG(DISTINCT "Result",', ' ORDER BY "Result") 
        END as "Result",             
        CASE WHEN MAX("end_complete") = 1 and MAX("start_complete") = 1 THEN 'Completed' 
             WHEN MAX("end_complete") = 1 THEN 'Started' 
             WHEN MAX("start_complete") = 1 THEN 'Started' 
             ELSE 'New' 
        END as "Status"              
    FROM(         
        select                                     
            MIN("key") OVER (PARTITION BY post_id,"key") "key",                  
            MIN(CASE WHEN task_id = 665 THEN "Time"::timestamp without time zone ELSE NULL END) OVER (PARTITION BY post_id,"key") "start_time",             
            MAX(CASE WHEN task_id = 666 THEN "Time"::timestamp without time zone ELSE NULL END) OVER (PARTITION BY post_id,"key") "end_time",             
            MAX(CASE WHEN task_id = 665 THEN complete::int ELSE 0::int END) OVER (PARTITION BY post_id,"key") "start_complete",                             
            MAX(CASE WHEN task_id = 666 THEN complete::int ELSE 0::int END) OVER (PARTITION BY post_id,"key") "end_complete",                             
            MAX(CASE WHEN "task_component" = 8980 and created_at::date >= '2022-11-21' and post_date >= '2022-11-21T13:00:00'  and complete = TRUE THEN entity_objects ELSE NULL::text END) OVER (PARTITION BY post_id,"key") "start_json",                             
            MAX(CASE WHEN "task_component" = 8985 and created_at::date >= '2022-11-21' and post_date >= '2022-11-21T13:00:00'  and complete = TRUE THEN entity_objects ELSE NULL::text END) OVER (PARTITION BY post_id,"key") "end_json",                       
            MAX(CASE WHEN "task_component" = 9244 and created_at::date >= '2022-11-21' and post_date >= '2022-11-21T13:00:00'  and complete = TRUE THEN entity_objects ELSE NULL::text END) OVER (PARTITION BY post_id,"key") "acs_json",                
            post_id,             
            post_date,                          
            external_ref_id,                          
            "Corridor",             
            "task_name",                        
            "adj_order",                       
            "adj_detail_name",             
            "Result",             
            "Time",             
            "workflow_name"               
        FROM             
        (                   
            SELECT post_id, "key", task_id, complete, created_at, entity_objects, post_date, external_ref_id, "Corridor", "task_name",          
                "adj_order", "adj_detail_name", "Result", "Time", "workflow_name", "task_component" 
            FROM (        
                SELECT uj.post_id, uotr.id as "key", uot.task_id, uotr.complete, uotr.created_at, result_obj.entity_objects::text,             
                    uj.post_date,             
                    --is_image."Images",             
                    uj.external_ref_id,                          
                    mp.name "Corridor",             
                    UPPER(ums_task.name) as "task_name",                        
                    CASE UPPER(TRIM(tc."name")) 
                        WHEN 'END PHOTO' THEN 110+ (ums_task.id*10000)                                         
                        WHEN 'CREW NAMES' THEN 200+ (ums_task.id*10000)                                         
                        WHEN 'VEHICLE REGISTRATION' THEN 300+ (ums_task.id*10000)                                         
                        WHEN 'LOCATION' THEN 400+ (ums_task.id*10000)                                         
                        WHEN 'START PHOTO' THEN 100+ (ums_task.id*10000)             
                        ELSE tc."order" + (ums_task.id*10000) 
                    END "adj_order",                       
                    UPPER(TRIM(tc."name"))  as "adj_detail_name",             
                    NULLIF(CASE WHEN UPPER(TRIM(tc."name")) = 'VEHICLE REGISTRATION' THEN UPPER(REGEXP_REPLACE(otcrb.report_value,'\s+','')) ELSE TRIM(otcrb.report_value) END,'') as "Result",             
                    otcrb_time.report_value as "Time",             
                    uw.name as "workflow_name",             
                    tc."id" as "task_component"             
                from eaco.ums_jobs uj      
                inner join lateral          
                (              
                    select ujw.workflow_id, ujw.stage_id from eaco.ums_job_workflows ujw               
                    where ujw.post_id = uj.post_id               
                    order by ujw.stage_date desc              
                    limit 1          
                ) ujw on 1=1                          
                inner join eaco.ums_workflows uw on uw.workflow_id = ujw.workflow_id and uw.name in ('Sydney Trains Corridors')              
                inner join eaco.ums_stages us on ujw.stage_id = us.stage_id and (us.status_name <> 'Cancelled')  
                left join eaco.ums_managed_properties mp on mp.managed_property_id = uj.managed_property_id            
                inner join eaco.ums_sub_categories sc  on sc.cat_id = uj.post_category    
                inner join eaco.ums_master_categories mc on uj.ma_cat_id = mc.ma_cat_id             
                inner join eaco.ums_object_task uot on uot.task_id  in (665) and uot.task_for_object_id = uj.oid                                  
                inner join eaco.ums_task on ums_task.id = uot.task_id                      
                inner join eaco.ums_task_component tc ON tc.task_id = uot.task_id and (tc.archived = FALSE)                 
                inner join lateral 
                ( 
                    select uot.task_id, b.object_task_id, b.id,b.complete,b.created_at,b.updated_at, ROW_NUMBER() over (partition by uot.task_id, b.object_task_id order by b.complete desc, b.id asc ) as "valid" from  
                    eaco.ums_object_task_result b where uot.id = b.object_task_id and b.complete = TRUE 
                ) uotr on 1 = 1         
                inner join eaco.ums_object_task_component otc_time on (uot.id = otc_time.object_task_id) and (otc_time.task_component_id in (8982,8987))         
                inner join eaco.ums_object_task_component_result_base otcrb_time on otcrb_time.object_task_result_id = uotr.id and (otcrb_time.type in ('timestamp')) and (otcrb_time.object_task_component_id = otc_time.id)                 
                left join eaco.ums_object_task_component otc on (uot.id = otc.object_task_id) and (otc.task_component_id = tc.id) and (otc.task_component_id not in (8982,8987))                
                left join eaco.ums_object_task_component_result_base otcrb on otcrb.object_task_result_id = uotr.id and (otcrb.type in ('entityobjects','string','geopoint')) and (otcrb.object_task_component_id = otc.id)          
                left join eaco.ums_object_task_component_result_entity_objects result_obj on result_obj.id = otcrb.id 
                where uj.customer_oid = 3017755 and uj.cancelled_date is null and upper(tc."name") not in ('TIME') and (otcrb_time.report_value IS NOT NULL)  

                UNION ALL                 
                
                SELECT uj.post_id, uotr_end.id as "key", uot.task_id, uotr.complete, uotr.created_at, result_obj.entity_objects::text,             
                    uj.post_date,             
                    --is_image."Images",             
                    uj.external_ref_id,                          
                    mp.name "Corridor",             
                    UPPER(ums_task.name) as "task_name",                        
                    CASE UPPER(TRIM(tc."name")) 
                        WHEN 'END PHOTO' THEN 110+ (ums_task.id*10000)                                         
                        WHEN 'CREW NAMES' THEN 200+ (ums_task.id*10000)                                         
                        WHEN 'VEHICLE REGISTRATION' THEN 300+ (ums_task.id*10000)                                         
                        WHEN 'LOCATION' THEN 400+ (ums_task.id*10000)                                         
                        WHEN 'START PHOTO' THEN 100+ (ums_task.id*10000)             
                        ELSE tc."order" + (ums_task.id*10000) 
                    END "adj_order",                       
                    UPPER(TRIM(tc."name"))  as "adj_detail_name",             
                    NULLIF(CASE WHEN UPPER(TRIM(tc."name")) = 'VEHICLE REGISTRATION' THEN UPPER(REGEXP_REPLACE(otcrb.report_value,'\s+','')) ELSE TRIM(otcrb.report_value) END,'') as "Result",             
                    otcrb_time.report_value as "Time",             
                    uw.name as "workflow_name",             
                    tc."id" as "task_component"             
                from eaco.ums_jobs uj      
                inner join lateral          
                (              
                    select ujw.workflow_id, ujw.stage_id from eaco.ums_job_workflows ujw               
                    where ujw.post_id = uj.post_id               
                    order by ujw.stage_date desc              
                    limit 1          
                ) ujw on 1=1                          
                inner join eaco.ums_workflows uw on uw.workflow_id = ujw.workflow_id and uw.name in ('Sydney Trains Corridors')              
                inner join eaco.ums_stages us on ujw.stage_id = us.stage_id and (us.status_name <> 'Cancelled')  
                left join eaco.ums_managed_properties mp on mp.managed_property_id = uj.managed_property_id            
                inner join eaco.ums_sub_categories sc  on sc.cat_id = uj.post_category    
                inner join eaco.ums_master_categories mc on uj.ma_cat_id = mc.ma_cat_id             
                inner join eaco.ums_object_task uot on uot.task_id  in (666) and uot.task_for_object_id = uj.oid                                  
                inner join eaco.ums_task on ums_task.id = uot.task_id                      
                inner join eaco.ums_task_component tc ON tc.task_id = uot.task_id and (tc.archived = FALSE) --and (tc.id not in (9244))                 
                inner join lateral 
                ( 
                    select uot.task_id, b.object_task_id, b.id,b.complete,b.created_at,b.updated_at, ROW_NUMBER() over (partition by uot.task_id, b.object_task_id order by b.complete desc, b.id asc ) as "valid" from  
                    eaco.ums_object_task_result b where uot.id = b.object_task_id and b.complete = TRUE 
                ) uotr on 1 = 1         
                inner join lateral         
                (              
                    select b2.id from  eaco.ums_object_task uot2               
                    inner join eaco.ums_object_task_result b2 on uot2.id = b2.object_task_id              
                    where uot2.task_id  in (665) and uot2.task_for_object_id = uj.oid and b2.created_at <= uotr.created_at and b2.complete = TRUE              
                    order by b2.created_at desc                              
                    limit 1         
                ) uotr_end on 1=1         
                inner join eaco.ums_object_task_component otc_time on (uot.id = otc_time.object_task_id) and (otc_time.task_component_id in (8982,8987))         
                inner join eaco.ums_object_task_component_result_base otcrb_time on otcrb_time.object_task_result_id = uotr.id and (otcrb_time.type in ('timestamp')) and (otcrb_time.object_task_component_id = otc_time.id)                 
                left join eaco.ums_object_task_component otc on (uot.id = otc.object_task_id) and (otc.task_component_id = tc.id) and (otc.task_component_id not in (8982,8987))                
                left join eaco.ums_object_task_component_result_base otcrb on otcrb.object_task_result_id = uotr.id and (otcrb.type in ('entityobjects','string','geopoint')) and (otcrb.object_task_component_id = otc.id)          
                left join eaco.ums_object_task_component_result_entity_objects result_obj on result_obj.id = otcrb.id 
                where uj.customer_oid = 3017755 and uj.cancelled_date is null and upper(tc."name") not in ('TIME') and (otcrb_time.report_value IS NOT NULL)  
            ) "base"             
        ) "base2" 
    ) "base3"       
    group by 1,2,3,4,5,6,7,8,9,10,11,12,13,14 
) "detail"            
left join lateral          
(             
    select CONCAT('https://client.ums.com.au/jobs/',"post_id",'/files/',(e.v->'domain_id')::text,'/') as "URL" 
    FROM json_array_elements("start_json"::json) as e(v)              
    where e.v is not null and ((e.v->'is_image')::text in ('"1"','true'))                 
    limit 1                 
) start_task_image on TRUE         
left join lateral          
(             
    select CONCAT('https://client.ums.com.au/jobs/',"post_id",'/files/',(e.v->'domain_id')::text,'/') as "URL" 
    FROM json_array_elements("end_json"::json) as e(v)              
    where e.v is not null and ((e.v->'is_image')::text in ('"1"','true'))                 
    limit 1                 
) end_task_image on TRUE     
left join lateral          
(             
    select CONCAT('https://client.ums.com.au/jobs/',"post_id",'/files/',(e.v->'domain_id')::text,'/') as "URL" 
    FROM json_array_elements("acs_json"::json) as e(v)              
    where e.v is not null and ((e.v->'is_image')::text in ('"1"','true'))                 
    limit 1                 
) acs_task_image on TRUE 
where ("adj_detail_name" not in (''))  
order by "Task_Ord","adj_order" 
*/

-- =============================================================================

/* 
VIEW: reporting_data.view_sydney_trains_graffiti_front_of_train
PURPOSE: Tracks front-of-train graffiti inspection data with GPS coordinates
FEATURES: GPS parsing, ride duration calculation, image processing
*/
/*
DROP VIEW IF EXISTS reporting_data.view_sydney_trains_graffiti_front_of_train;
CREATE OR REPLACE VIEW reporting_data.view_sydney_trains_graffiti_front_of_train AS
select  
    start_time::timestamp without time zone "start_time", 
    to_char(start_time,'YYYY-MM-DD')::date "start_time_day", 
    to_char(start_time,'YYYY-MM-01')::date "start_time_month", 
    to_char(start_time,'YYYY-01-01')::date "start_time_year", 
    end_time::timestamp without time zone "end_time", 
    to_char(end_time,'YYYY-MM-DD')::date "end_time_day", 
    to_char(end_time,'YYYY-MM-01')::date "end_time_month", 
    to_char(end_time,'YYYY-01-01')::date "end_time_year", 
    CASE WHEN start_time::timestamp without time zone IS NOT NULL 
         AND end_time::timestamp without time zone IS NOT NULL 
         and start_time::timestamp without time zone <= end_time::timestamp without time zone  
         THEN EXTRACT(EPOCH FROM end_time::timestamp without time zone-start_time::timestamp without time zone)/3600.0 
         ELSE NULL 
    END AS "TrainRideDuration",   
    detail."post_id",      
    detail.workflow_name,       
    CONCAT('https://client.ums.com.au/jobs/',"post_id",'/') as "URL",     
    start_task_image."URL" as "Start_URL",     
    end_task_image."URL" as "End_URL",      
    DENSE_RANK() OVER (ORDER BY COALESCE(start_time::timestamp without time zone,created_at::timestamp without time zone), "key") as "Task_Ord",     
    DENSE_RANK() OVER (PARTITION BY detail."post_id" ORDER BY COALESCE(start_time::timestamp without time zone,created_at::timestamp without time zone), "key") as "Task_Ord_Disp",    
    "key", 
    "Corridor", 
    "task_name",                  
    "GPS_Latitude_Start",  
    "GPS_Longitude_Start",      
    "GPS_Latitude_End",  
    "GPS_Longitude_End" 
FROM (        
    SELECT uj.post_id, uotr.id as "key", uot.task_id, uotr.complete, uotr.created_at,              
        uj.post_date,             
        --is_image."Images",             
        uj.external_ref_id,                          
        mp.name "Corridor",             
        UPPER(ums_task.name) as "task_name",             
        result_obj_photo_start.entity_objects::text as "Photo_Start",                       
        NULLIF(otcrb_time_start.report_value,'')::timestamp without time zone as "start_time",             
        NULLIF(REGEXP_REPLACE(otcrb_gps_start.report_value,'^((\s*([0-9\-\.]+?)\s*,\s*([0-9\.]+)\s*)|(.+))$','\3'),'')::float as "GPS_Latitude_Start",             
        NULLIF(REGEXP_REPLACE(otcrb_gps_start.report_value,'^((\s*([0-9\-\.]+?)\s*,\s*([0-9\.]+)\s*)|(.+))$','\4'),'')::float as "GPS_Longitude_Start",             
        result_obj_photo_end.entity_objects::text as "Photo_End",                       
        NULLIF(otcrb_time_end.report_value,'')::timestamp without time zone as "end_time",             
        NULLIF(REGEXP_REPLACE(otcrb_gps_end.report_value,'^((\s*([0-9\-\.]+?)\s*,\s*([0-9\.]+)\s*)|(.+))$','\3'),'')::float as "GPS_Latitude_End",             
        NULLIF(REGEXP_REPLACE(otcrb_gps_end.report_value,'^((\s*([0-9\-\.]+?)\s*,\s*([0-9\.]+)\s*)|(.+))$','\4'),'')::float as "GPS_Longitude_End",             
        uw.name as "workflow_name"                                
    from eaco.ums_jobs uj      
    inner join lateral          
    (              
        select ujw.workflow_id, ujw.stage_id from eaco.ums_job_workflows ujw               
        where ujw.post_id = uj.post_id               
        order by ujw.stage_date desc              
        limit 1          
    ) ujw on 1=1                          
    inner join eaco.ums_workflows uw on uw.workflow_id = ujw.workflow_id and uw.name in ('Sydney Trains Corridors')              
    inner join eaco.ums_stages us on ujw.stage_id = us.stage_id and (us.status_name <> 'Cancelled')  
    left join eaco.ums_managed_properties mp on mp.managed_property_id = uj.managed_property_id            
    inner join eaco.ums_sub_categories sc  on sc.cat_id = uj.post_category    
    inner join eaco.ums_master_categories mc on uj.ma_cat_id = mc.ma_cat_id             
    inner join eaco.ums_object_task uot on uot.task_id  in (695) and uot.task_for_object_id = uj.oid                                  
    inner join eaco.ums_task on ums_task.id = uot.task_id                      
    --inner join eaco.ums_task_component tc ON tc.task_id = uot.task_id and (tc.archived = FALSE)                 
    inner join lateral 
    ( 
        select uot.task_id, b.object_task_id, b.id,b.complete,b.created_at,b.updated_at, ROW_NUMBER() over (partition by uot.task_id, b.object_task_id order by b.complete desc, b.id asc ) as "valid" from  
        eaco.ums_object_task_result b where uot.id = b.object_task_id and b.complete = TRUE 
    ) uotr on 1 = 1                
    left join eaco.ums_object_task_component otc_time_start on (uot.id = otc_time_start.object_task_id) and (otc_time_start.task_component_id in (9286))               
    left join eaco.ums_object_task_component_result_base otcrb_time_start on otcrb_time_start.object_task_result_id = uotr.id and (otcrb_time_start.type in ('timestamp')) and (otcrb_time_start.object_task_component_id = otc_time_start.id)                       
    left join eaco.ums_object_task_component otc_gps_start on (uot.id = otc_gps_start.object_task_id) and (otc_gps_start.task_component_id in (9270))              
    left join eaco.ums_object_task_component_result_base otcrb_gps_start on otcrb_gps_start.object_task_result_id = uotr.id and (otcrb_gps_start.type in ('geopoint')) and (otcrb_gps_start.object_task_component_id = otc_gps_start.id)        
    left join eaco.ums_object_task_component otc_photo_start on (uot.id = otc_photo_start.object_task_id) and (otc_photo_start.task_component_id in (9269))       
    left join eaco.ums_object_task_component_result_base otcrb_photo_start on otcrb_photo_start.object_task_result_id = uotr.id and (otcrb_photo_start.type in ('entityobjects')) and (otcrb_photo_start.object_task_component_id = otc_photo_start.id)        
    left join eaco.ums_object_task_component_result_entity_objects result_obj_photo_start on result_obj_photo_start.id = otcrb_photo_start.id        
    left join eaco.ums_object_task_component otc_time_end on (uot.id = otc_time_end.object_task_id) and (otc_time_end.task_component_id in (9287))               
    left join eaco.ums_object_task_component_result_base otcrb_time_end on otcrb_time_end.object_task_result_id = uotr.id and (otcrb_time_end.type in ('timestamp')) and (otcrb_time_end.object_task_component_id = otc_time_end.id)                       
    left join eaco.ums_object_task_component otc_gps_end on (uot.id = otc_gps_end.object_task_id) and (otc_gps_end.task_component_id in (9271))              
    left join eaco.ums_object_task_component_result_base otcrb_gps_end on otcrb_gps_end.object_task_result_id = uotr.id and (otcrb_gps_end.type in ('geopoint')) and (otcrb_gps_end.object_task_component_id = otc_gps_end.id)        
    left join eaco.ums_object_task_component otc_photo_end on (uot.id = otc_photo_end.object_task_id) and (otc_photo_end.task_component_id in (9272))       
    left join eaco.ums_object_task_component_result_base otcrb_photo_end on otcrb_photo_end.object_task_result_id = uotr.id and (otcrb_photo_end.type in ('entityobjects')) and (otcrb_photo_end.object_task_component_id = otc_photo_end.id)        
    left join eaco.ums_object_task_component_result_entity_objects result_obj_photo_end on result_obj_photo_end.id = otcrb_photo_end.id 
    where uj.customer_oid = 3017755 and uj.cancelled_date is null  
) "detail"         
left join lateral          
(             
    select CONCAT('https://client.ums.com.au/jobs/',"post_id",'/files/',(e.v->'domain_id')::text,'/') as "URL" 
    FROM json_array_elements("Photo_Start"::json) as e(v)              
    where e.v is not null and ((e.v->'is_image')::text in ('"1"','true'))                 
    limit 1                 
) start_task_image on TRUE         
left join lateral          
(             
    select CONCAT('https://client.ums.com.au/jobs/',"post_id",'/files/',(e.v->'domain_id')::text,'/') as "URL" 
    FROM json_array_elements("Photo_End"::json) as e(v)              
    where e.v is not null and ((e.v->'is_image')::text in ('"1"','true'))                 
    limit 1                 
) end_task_image on TRUE 
*/

-- =============================================================================

/* 
VIEW: reporting_data.view_sydney_trains_graffiti_data
PURPOSE: Main graffiti inspection data with comprehensive field extraction
FEATURES: Asset tracking, inspection results, paint usage, GPS coordinates
*/
/*
DROP VIEW IF EXISTS reporting_data.view_sydney_trains_graffiti_data;
CREATE OR REPLACE VIEW reporting_data.view_sydney_trains_graffiti_data AS
SELECT 
    COALESCE("latitude","insp_latitude") as latitude,        
    COALESCE("longitude","insp_longitude") as longitude,                 
    "Asset ID",              
    "Job ID",              
    "Asset Category",             
    "Asset Name",             
    "Inspection Date",             
    "Scheduled Inspection Date", 			
    "Corridor",                   
    "Inspection Notes",                           
    "status",             
    oid,             
    customer_oid,                    
    "customer_name", 		                
    "managed_property_address",             
    job_address,             
    managed_property_id,             
    ma_cat_name,             
    cat_name,			             
    proj_name,                                
    post_id,             
    "post_date",             
    "job_description",            
    "Due Date",            
    "Inspection Id",            
    user_id,            
    checkin_id,            
    "URL",            
    "Result",           
    "Workflow",                    
    "Inspection_Ord",             
    "SQM",           
    "Tags",            
    "Obstructions",             
    "Area/Suburb",            
    "Paint Colour",             
    "Paint Used (Litres)" ,            
    "Offensive?"     
FROM (         
    select     
        NULLIF(ass.latitude,0) as latitude,              
        NULLIF(ass.longitude,0) as longitude,              
        ass.external_ref_id "Asset ID",              
        uj.post_id "Job ID",              
        ac.name "Asset Category",             
        ass.name "Asset Name",             
        i.inspected_date::timestamp without time zone "Inspection Date",             
        i.scheduled_date::timestamp without time zone "Scheduled Inspection Date", 		
        mp.name "Corridor",                   
        i.notes "Inspection Notes",                           
        CASE WHEN us.name = 'Job Completed' or uj.completed_date IS NOT NULL then 'Y' ELSE 'N' end "status",             
        uj.oid,             
        uc.customer_oid,                    
        uc.name "customer_name", 		                 
        mp.address "managed_property_address",             
        uj.job_address,             
        mp.managed_property_id,             
        mc.ma_cat_name,             
        sc.cat_name,			             
        uj.proj_name,                                
        uj.post_id,             
        uj.post_date::timestamp without time zone "post_date",             
        uj.description "job_description",            
        uj.due_date "Due Date",            
        i.inspection_id "Inspection Id",            
        pcu.user_id,            
        i.checkin_id,            
        CONCAT('https://client.ums.com.au/inspections/',i.inspection_id,'/') as "URL",            
        --CONCAT('https://ums-sydneytrains.eaco.me/inspections/',i.inspection_id,'/report/') as "URL",            
        inso.name "Result",            
        uw.name "Workflow",                    
        100000000+(ROW_NUMBER() OVER (ORDER BY i.inspected_date::timestamp without time zone, i.inspection_id )) as "Inspection_Ord",            
        MAX(UPPER(NULLIF(LTRIM(RTRIM(SQM.report_value)),''))) as "SQM",            
        MAX(UPPER(NULLIF(LTRIM(RTRIM(TAGS.report_value)),''))) as "Tags",            
        MAX(UPPER(NULLIF(LTRIM(RTRIM(OBS.report_value)),''))) as "Obstructions",            
        MAX(UPPER(NULLIF(LTRIM(RTRIM( ass_var.value)),''))) as "Area/Suburb",            
        MAX(UPPER(NULLIF(LTRIM(RTRIM(COL.report_value)),''))) as "Paint Colour",            
        MAX(NULLIF(regexp_replace(regexp_replace(UPPER(NULLIF(LTRIM(RTRIM(LTR.report_value)),'')),'[^\d\.]*','','g'),'\.+','\.','g'),'')::DOUBLE PRECISION) as "Paint Used (Litres)" ,            
        MAX(UPPER(NULLIF(LTRIM(RTRIM(OFF.report_value)),''))) as "Offensive?",            
        NULLIF(REGEXP_REPLACE(MAX(UPPER(NULLIF(LTRIM(RTRIM(GEO.report_value)),''))),'^((.*?([\\d\\-\\.]+).*?([\\d\\-\\.]+).*)|(.*))$','\\3'),'')::float as "insp_latitude",            
        NULLIF(REGEXP_REPLACE(MAX(UPPER(NULLIF(LTRIM(RTRIM(GEO.report_value)),''))),'^((.*?([\\d\\-\\.]+).*?([\\d\\-\\.]+).*)|(.*))$','\\4'),'')::float as "insp_longitude"              
    from eaco.ums_jobs uj   
    inner join lateral          
    (              
        select ujw.workflow_id, ujw.stage_id from eaco.ums_job_workflows ujw               
        where ujw.post_id = uj.post_id               
        order by ujw.stage_date desc              
        limit 1          
    ) ujw on 1=1                          
    inner join eaco.ums_workflows uw on uw.workflow_id = ujw.workflow_id and uw.name in ('Sydney Trains Corridors')              
    inner join eaco.ums_stages us on ujw.stage_id = us.stage_id and (us.status_name <> 'Cancelled')    
    inner join eaco.ums_customers uc on uc.customer_oid = uj.customer_oid    
    inner join eaco.ums_managed_properties mp on mp.managed_property_id = uj.managed_property_id       
    inner join eaco.ums_master_categories mc on uj.ma_cat_id = mc.ma_cat_id   
    inner join eaco.ums_sub_categories sc  on sc.cat_id = uj.post_category     
    inner join eaco.ums_inspections i on i.inspection_post_id = uj.post_id   
    inner join eaco.ums_assets ass on ass.asset_id = i.asset_id   
    left join eaco.ums_asset_classes ac on ass.asset_class_id  = ac.asset_class_id   
    left join eaco.ums_provider_client_users pcu ON i.inspector_user_id = pcu.user_id   
    left join eaco.ums_custom_var_values  ass_var on ass_var.custom_var_id in (408) and ass_var.object_oid = ass.oid   
    --left join eaco.ums_custom_var_values  var on var.custom_var_id in (427,428,444,453,936,937) and var.object_oid = i.oid               
    --inner join eaco.ums_task_component tc ON tc.task_id = 608 and (tc.archived = FALSE)             
    inner join eaco.ums_object_task uot on uot.task_id = 608 and uot.task_for_object_id = i.oid                       
    left join lateral 
    (              
        select uot.task_id, b.object_task_id, b.notes, b.id,b.complete,b.created_at,b.updated_at, ROW_NUMBER() over (partition by uot.task_id, b.object_task_id order by b.complete desc, b.id asc ) as "valid" from  
        eaco.ums_object_task_result b where uot.id = b.object_task_id			 
    ) uotr on uotr.valid = 1         
    left join eaco.ums_object_task_component SQM_otc on (uot.id = SQM_otc.object_task_id) and (SQM_otc.task_component_id = 8482)         
    left join eaco.ums_object_task_component_result_base SQM on SQM.object_task_result_id = uotr.id and (SQM.object_task_component_id = SQM_otc.id)                  
    left join eaco.ums_object_task_component TAGS_otc on (uot.id = TAGS_otc.object_task_id) and (TAGS_otc.task_component_id = 8483)         
    left join eaco.ums_object_task_component_result_base TAGS on TAGS.object_task_result_id = uotr.id and (TAGS.object_task_component_id = TAGS_otc.id)                  
    left join eaco.ums_object_task_component OBS_otc on (uot.id = OBS_otc.object_task_id) and (OBS_otc.task_component_id = 8484)         
    left join eaco.ums_object_task_component_result_base OBS on OBS.object_task_result_id = uotr.id and (OBS.object_task_component_id = OBS_otc.id)                  
    left join eaco.ums_object_task_component COL_otc on (uot.id = COL_otc.object_task_id) and (COL_otc.task_component_id = 8487)         
    left join eaco.ums_object_task_component_result_base COL on COL.object_task_result_id = uotr.id and (COL.object_task_component_id = COL_otc.id)            
    left join eaco.ums_object_task_component LTR_otc on (uot.id = LTR_otc.object_task_id) and (LTR_otc.task_component_id = 8486)         
    left join eaco.ums_object_task_component_result_base LTR on LTR.object_task_result_id = uotr.id and (LTR.object_task_component_id = LTR_otc.id)            
    left join eaco.ums_object_task_component OFF_otc on (uot.id = OFF_otc.object_task_id) and (OFF_otc.task_component_id = 8485)         
    left join eaco.ums_object_task_component_result_base OFF on OFF.object_task_result_id = uotr.id and (OFF.object_task_component_id = OFF_otc.id)           
    left join eaco.ums_object_task_component GEO_otc on (uot.id = GEO_otc.object_task_id) and (GEO_otc.task_component_id = 8488 )         
    left join eaco.ums_object_task_component_result_base GEO on GEO.object_task_result_id = uotr.id and (GEO.object_task_component_id = GEO_otc.id)              
    left join eaco.ums_inspection_outcomes inso on i.outcome_id = inso.outcome_id 
    where uj.customer_oid = 3017755 and uj.cancelled_date is null  
    group by 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30 
) "insp" 
*/

-- =============================================================================

/* 
VIEW: reporting_data.view_sydney_trains_task_headers
PURPOSE: Hierarchical task header structure for reporting organization
FEATURES: Multi-level header numbering, task component organization
*/
/*
DROP VIEW IF EXISTS reporting_data.view_sydney_trains_task_headers;
CREATE OR REPLACE VIEW reporting_data.view_sydney_trains_task_headers AS
SELECT 
    task_id,
    CONCAT(RIGHT(CONCAT('0',DENSE_RANK() OVER (PARTITION BY task_id ORDER BY lvl_1_order)),2),'. ',REGEXP_REPLACE(lvl_1_name,'^.{1,2}\.\\s*','')) as lvl_1_name,
    CASE WHEN lvl_2_order IS NOT NULL 
         THEN CONCAT(RIGHT(CONCAT('0',ROW_NUMBER() OVER (PARTITION BY task_id,lvl_1_order ORDER BY lvl_2_order)),2),'. ',lvl_2_name) 
         ELSE NULL 
    END as lvl_2_name,
    "component_id" 
FROM ( 
    select "tc_data"."id" as "component_id", 
        tc_data.task_id, 
        CASE WHEN tc_hdr."order" IS NULL THEN NULL ELSE ROW_NUMBER() OVER( PARTITION BY tc_data.task_id ORDER BY tc_data."order" asc, tc_data.id asc) END as "lvl_2_order",
        CASE WHEN "tc_hdr"."order" IS NULL THEN ROW_NUMBER() OVER( PARTITION BY tc_data.task_id ORDER BY tc_data."order" asc, tc_data.id asc) ELSE DENSE_RANK() OVER (PARTITION BY tc_data.task_id ORDER BY COALESCE(tc_hdr."order",tc_data."order"), COALESCE("tc_hdr"."tc_hdr_id","tc_data"."id")) END as "lvl_1_order", 
        CASE WHEN tc_hdr."order" IS NULL THEN NULL ELSE tc_data.name END as "lvl_2_name", 
        COALESCE(tc_hdr.name,tc_data.name) as "lvl_1_name" 
    from eaco.ums_task_component tc_data 
    LEFT JOIN LATERAL ( 
        select task_id, "name", tc_hdr."order" as "order", COALESCE(tc_hdr_nxt."order",999999999) as nxt_order, tc_hdr.id as tc_hdr_id 
        from eaco.ums_task_component tc_hdr  
        LEFT JOIN LATERAL ( 
            select tc_hdr_nxt."order" from eaco.ums_task_component tc_hdr_nxt 
            where tc_hdr_nxt.task_component_type_id = 1 and tc_hdr_nxt.task_id = tc_data.task_id and tc_hdr_nxt."order" > tc_hdr."order" and tc_hdr_nxt.archived = FALSE 
            order by tc_hdr_nxt."order" asc 
            limit 1 
        ) "tc_hdr_nxt" on TRUE 
        where tc_hdr.task_component_type_id = 1 and tc_hdr.task_id = tc_data.task_id and tc_hdr.archived = FALSE 
    ) "tc_hdr" ON tc_data."order" > "tc_hdr"."order" and tc_data."order" < "tc_hdr"."nxt_order" 
    where tc_data.task_component_type_id <>  1 and tc_data.task_id in (48) and tc_data.archived = FALSE 
)  "qry" 
where COALESCE(lvl_1_name,lvl_2_name) <> '' 
--order by qry.task_id, COALESCE(lvl_1_order,lvl_2_order), lvl_2_order 
*/

-- =============================================================================

/* 
VIEW: reporting_data.view_sydney_trains_job_task_link
PURPOSE: Links jobs to tasks for cross-referencing and reporting
*/
/*
DROP VIEW IF EXISTS reporting_data.view_sydney_trains_job_task_link;
CREATE OR REPLACE VIEW reporting_data.view_sydney_trains_job_task_link AS
select      
    uot.task_id, 
    ums_jobs.post_id, 
    concat(uot.task_id, '---', ums_jobs.post_id) as "key",       
    REGEXP_REPLACE(uw.name,'\\s*sydney\\s*trains\\s*','','gi') as "value1", 
    uot.name as "value2" 
from eaco.ums_jobs        
inner join lateral          
(              
    select ujw.workflow_id, ujw.stage_id  from eaco.ums_job_workflows ujw               
    where ujw.post_id = ums_jobs.post_id               
    order by ujw.stage_date desc              
    limit 1          
) ujw on 1=1                   
inner join eaco.ums_workflows uw on uw.workflow_id = ujw.workflow_id        
inner join eaco.ums_stages us on ujw.stage_id = us.stage_id        
inner join eaco.ums_object_task uot on uot.task_id in (48) and uot.task_for_object_id = ums_jobs.oid      
where ums_jobs.customer_oid = 3017755 and ums_jobs.cancelled_date is null and replace(us.name,' â€" ',', ') <> 'Cancelled'  
*/

-- =============================================================================

/* 
VIEW: reporting_data.view_sydney_trains_task_results
PURPOSE: Task completion results with temporal grouping
FEATURES: Date grouping, year ordering, result aggregation
*/
/*
DROP VIEW IF EXISTS reporting_data.view_sydney_trains_task_results;
CREATE OR REPLACE VIEW reporting_data.view_sydney_trains_task_results AS
select  
    task_id, 
    --name, 
    complete, 
    created_at::timestamp without time zone "created_at", 
    to_char(created_at,'YYYY-MM-DD')::date "created_at_day", 
    to_char(created_at,'YYYY-MM-01')::date "created_at_month", 
    to_char(created_at,'YYYY-01-01')::date "created_at_year", 
    to_char(NOW() at time zone 'Australia/Victoria','YYYY')::int - to_char(created_at::timestamp without time zone,'YYYY')::int "year_order", 
    updated_at::timestamp without time zone "updated_at", 
    post_id, 
    --"TD", 
    --1 as "Job Count", 
    --"key", 
    "key_result",  
    "Result" 
FROM (                      
    select              
        (select now() at time zone 'Australia/Victoria')::date as "TD",             
        uot.task_id,                         
        uot.name,             
        uotr.complete,             
        uotr.created_at,             
        uotr.updated_at,             
        uj.post_id          
        --   , concat(uot.task_id, '---', uj.post_id) as "key"             
        , concat(uot.task_id, '---', uj.post_id,'---',tc.id) as "key_result"             
        ,NULLIF(LTRIM(RTRIM(otcrb.report_value)),'') as "Result"         
    from eaco.ums_jobs uj              
    inner join eaco.ums_object_task uot on uot.task_id  in (48) and uot.task_for_object_id = uj.oid          
    inner join eaco.ums_task_component tc ON (tc.archived = FALSE) and (tc.task_component_type_id not in (1)) and (tc.task_id = uot.task_id)                        
    left join lateral         
    ( 
        select uot.task_id, b.object_task_id, b.id,b.complete,b.created_at,b.updated_at, ROW_NUMBER() over (partition by uot.task_id, b.object_task_id order by b.complete desc, b.id asc ) as "valid" from 
        eaco.ums_object_task_result b where uot.id = b.object_task_id 			 
    ) uotr on uotr.valid = 1         
    left join eaco.ums_object_task_component otc on (uot.id = otc.object_task_id)and (otc.task_component_id = tc.id)          
    left join eaco.ums_object_task_component_result_base otcrb on otcrb.object_task_result_id = uotr.id and (otcrb.object_task_component_id = otc.id)                          
    where uj.customer_oid = 3017755  
) "base" 
*/

-- =============================================================================

/* 
VIEW: reporting_data.view_sydney_trains_graffiti_report_last_run
PURPOSE: Timestamp tracking for report generation
*/
/*
CREATE VIEW reporting_data.view_sydney_trains_graffiti_report_last_run AS 
select now() at time zone 'Australia/Victoria' as dt 
*/

--select * from eaco.ums_task_component where task_id in (665,666) limit 100

-- =============================================================================
-- SECTION 2: STAGING TABLE CREATION AND DATA POPULATION
-- =============================================================================

/*GRAFFITI DATA STAGING*/
DROP TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_data;
CREATE TABLE reporting_data.staging_sydney_trains_graffiti_data (
    LIKE reporting_data.view_sydney_trains_graffiti_data INCLUDING ALL
);
INSERT INTO reporting_data.staging_sydney_trains_graffiti_data 
select * from reporting_data.view_sydney_trains_graffiti_data;

/*FRONT OF TRAIN STAGING*/
DROP TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_front_of_train;
CREATE TABLE reporting_data.staging_sydney_trains_graffiti_front_of_train (
    LIKE reporting_data.view_sydney_trains_graffiti_front_of_train INCLUDING ALL
);
INSERT INTO reporting_data.staging_sydney_trains_graffiti_front_of_train 
select * from reporting_data.view_sydney_trains_graffiti_front_of_train;

/*START END TASKS STAGING*/
DROP TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_start_end_tasks;
CREATE TABLE reporting_data.staging_sydney_trains_graffiti_start_end_tasks (
    LIKE reporting_data.view_sydney_trains_graffiti_start_end_tasks INCLUDING ALL
);
INSERT INTO reporting_data.staging_sydney_trains_graffiti_start_end_tasks 
select * from reporting_data.view_sydney_trains_graffiti_start_end_tasks;

/*REPORT TIMESTAMP STAGING*/
DROP TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_report_last_run;
CREATE TABLE reporting_data.staging_sydney_trains_graffiti_report_last_run (
    LIKE reporting_data.view_sydney_trains_graffiti_report_last_run INCLUDING ALL
);
INSERT INTO reporting_data.staging_sydney_trains_graffiti_report_last_run 
select * from reporting_data.view_sydney_trains_graffiti_report_last_run;

/*TASK HEADERS STAGING*/
DROP TABLE IF EXISTS reporting_data.staging_sydney_trains_task_headers;
CREATE TABLE reporting_data.staging_sydney_trains_task_headers (
    LIKE reporting_data.view_sydney_trains_task_headers INCLUDING ALL
);
INSERT INTO reporting_data.staging_sydney_trains_task_headers 
select * from reporting_data.view_sydney_trains_task_headers;

/*TASK RESULTS STAGING*/
DROP TABLE IF EXISTS reporting_data.staging_sydney_trains_task_results;
CREATE TABLE reporting_data.staging_sydney_trains_task_results (
    LIKE reporting_data.view_sydney_trains_task_results INCLUDING ALL
);
INSERT INTO reporting_data.staging_sydney_trains_task_results 
select * from reporting_data.view_sydney_trains_task_results;

/*JOB TASK LINK STAGING*/
DROP TABLE IF EXISTS reporting_data.staging_sydney_trains_job_task_link;
CREATE TABLE reporting_data.staging_sydney_trains_job_task_link (
    LIKE reporting_data.view_sydney_trains_job_task_link INCLUDING ALL
);
INSERT INTO reporting_data.staging_sydney_trains_job_task_link 
select * from reporting_data.view_sydney_trains_job_task_link;

-- =============================================================================
-- SECTION 3: CLEANUP OF OLD TABLES
-- =============================================================================

DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_data;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_start_end_tasks;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_front_of_train;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_report_last_run;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_task_headers;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_task_results;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_job_task_link;

-- =============================================================================
-- SECTION 4: ATOMIC TABLE PROMOTION (TRANSACTION-SAFE SWAP)
-- =============================================================================

begin transaction;

    /*GRAFFITI DATA PROMOTION*/
    ALTER TABLE IF EXISTS reporting_data.final_sydney_trains_graffiti_data 
        RENAME TO old_sydney_trains_graffiti_data;
    ALTER TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_data 
        RENAME TO final_sydney_trains_graffiti_data;

    /*START END TASKS PROMOTION*/
    ALTER TABLE IF EXISTS reporting_data.final_sydney_trains_graffiti_start_end_tasks 
        RENAME TO old_sydney_trains_graffiti_start_end_tasks;
    ALTER TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_start_end_tasks 
        RENAME TO final_sydney_trains_graffiti_start_end_tasks;

    /*FRONT OF TRAIN PROMOTION*/
    ALTER TABLE IF EXISTS reporting_data.final_sydney_trains_graffiti_front_of_train 
        RENAME TO old_sydney_trains_graffiti_front_of_train;
    ALTER TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_front_of_train 
        RENAME TO final_sydney_trains_graffiti_front_of_train;

    /*TASK HEADERS PROMOTION*/
    ALTER TABLE IF EXISTS reporting_data.final_sydney_trains_task_headers 
        RENAME TO old_sydney_trains_task_headers;
    ALTER TABLE IF EXISTS reporting_data.staging_sydney_trains_task_headers 
        RENAME TO final_sydney_trains_task_headers;

    /*TASK RESULTS PROMOTION*/
    ALTER TABLE IF EXISTS reporting_data.final_sydney_trains_task_results 
        RENAME TO old_sydney_trains_task_results;
    ALTER TABLE IF EXISTS reporting_data.staging_sydney_trains_task_results 
        RENAME TO final_sydney_trains_task_results;

    /*JOB TASK LINK PROMOTION*/
    ALTER TABLE IF EXISTS reporting_data.final_sydney_trains_job_task_link 
        RENAME TO old_sydney_trains_job_task_link;
    ALTER TABLE IF EXISTS reporting_data.staging_sydney_trains_job_task_link 
        RENAME TO final_sydney_trains_job_task_link;

    /*REPORT TIMESTAMP PROMOTION*/
    ALTER TABLE IF EXISTS reporting_data.final_sydney_trains_graffiti_report_last_run 
        RENAME TO old_sydney_trains_graffiti_report_last_run;
    ALTER TABLE IF EXISTS reporting_data.staging_sydney_trains_graffiti_report_last_run 
        RENAME TO final_sydney_trains_graffiti_report_last_run;

commit transaction;

-- =============================================================================
-- SECTION 5: FINAL CLEANUP
-- =============================================================================

-- Clean up old tables after successful promotion
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_data;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_start_end_tasks;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_front_of_train;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_graffiti_report_last_run;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_task_headers;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_task_results;
DROP TABLE IF EXISTS reporting_data.old_sydney_trains_job_task_link;

-- =============================================================================
-- SECTION 6: MONITORING AND ALERTING UPDATE
-- =============================================================================

-- Update monitoring table with refresh timestamp and alert interval
-- Alert triggers if report refresh exceeds 90 minutes (5400 seconds)
-- Report refreshes every 20 minutes under normal operation
UPDATE reporting_data.info_report_last_updated  
SET "LastUpdated" = (current_timestamp::timestamp at time zone 'UTC'), 
    "AlertIntervalSeconds" = 5400 
where "Name" = 'sydney_trains_graffiti';

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================