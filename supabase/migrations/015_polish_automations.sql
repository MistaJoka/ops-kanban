-- Polish: extend automation action types for SMS templates and review requests

alter table automations drop constraint if exists automations_action_type_check;

alter table automations add constraint automations_action_type_check
  check (action_type in (
    'log_activity',
    'set_next_action',
    'send_sms_template',
    'send_review_request'
  ));
